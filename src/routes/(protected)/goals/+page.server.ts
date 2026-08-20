import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { predictGoalProgress } from '$lib/services/predictions';
import { performHealthCheck } from '$lib/services/anomalyDetection';
import { analyzeGoalAdaptation } from '$lib/services/goalAdaptation';
import { shouldExcludeFromStats } from '$lib/types/runs';
import { buildGoalEvidenceProjections } from '$lib/server/goalEvidenceProjection';
import { computeSessionGoalMetrics } from '$lib/server/sessionGoalMetrics';

type GateMetricRun = {
	reaction_time_ms: number | null;
	max_g: number | null;
	peak_speed_ms: number | null;
	elapsed_time_ms: number | null;
	time_to_peak_speed_ms: number | null;
	analytics_valid: boolean;
};

function gateRunsForSession(session: any): {
	eligibleRunCount: number;
	metricRuns: GateMetricRun[];
	reactions: number[];
} {
	const eligibleRuns = (session?.runs ?? []).filter(
		(run: any) => !shouldExcludeFromStats(run.tags as any)
	);

	const metricRuns: GateMetricRun[] = eligibleRuns.flatMap((run: any) => {
		const gates = Array.isArray(run.gate_runs)
			? run.gate_runs
			: run.gate_runs
				? [run.gate_runs]
				: [];

		return gates.map((gate: any) => ({
			reaction_time_ms: gate.reaction_time_ms ?? null,
			max_g: gate.max_g ?? null,
			peak_speed_ms: gate.peak_speed_ms ?? null,
			elapsed_time_ms: run.elapsed_time_ms ?? null,
			time_to_peak_speed_ms: gate.time_to_peak_speed_ms ?? null,
			analytics_valid: gate.analytics_valid ?? false
		}));
	});

	return {
		eligibleRunCount: eligibleRuns.length,
		metricRuns,
		reactions: metricRuns
			.map((run) => run.reaction_time_ms)
			.filter((value): value is number => value !== null)
	};
}

function reactionCvPercent(values: number[]): number {
	if (values.length < 2) return 0;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	if (mean <= 0) return 0;
	const variance =
		values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
	return (Math.sqrt(variance) / mean) * 100;
}

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();
	if (!profile) {
		return {
			goals: [],
			sessionCount: 0,
			currentValues: {},
			healthCheck: null
		};
	}

	const { data: goals } = await supabase
		.from('training_goals')
		.select(
			`
            id,
            metric,
            target_value,
            start_value,
            current_value,
            deadline,
            completed_at,
            distance_m,
            created_at,
            updated_at,
            user_id,
            goal_milestones(id, value, achieved_at)
        `
		)
		.eq('user_id', profile.id)
		.order('created_at', { ascending: false });

	let goalEvidence: Awaited<ReturnType<typeof buildGoalEvidenceProjections>> = {};
	try {
		goalEvidence = await buildGoalEvidenceProjections(
			supabase,
			profile.id,
			(goals ?? []).map((goal) => ({
				id: goal.id,
				metric: goal.metric,
				start_value: goal.start_value,
				created_at: goal.created_at,
				completed_at: goal.completed_at,
				distance_m: goal.distance_m
			}))
		);
	} catch (projectionError) {
		console.warn('[Goals] Evidence projection failed, using persisted fallback:', projectionError);
	}

	const { data: sessions } = await supabase
		.from('sessions')
		.select(
			`
            id,
            timestamp,
            session_focus,
            runs(
                elapsed_time_ms,
                distance_m,
                tags,
                gate_runs(
                    reaction_time_ms,
                    max_g,
                    peak_speed_ms,
                    analytics_valid,
                    time_to_peak_speed_ms
                )
            )
        `
		)
		.eq('user_id', profile.id)
		.eq('archived', false)
		.eq('session_type', 'gate')
		.order('timestamp', { ascending: false })
		.limit(20);

	const sessionEvidence = (sessions ?? []).map((session) => {
		const evidence = gateRunsForSession(session);
		return {
			session,
			...evidence,
			metrics: computeSessionGoalMetrics(evidence.metricRuns, evidence.eligibleRunCount)
		};
	});

	const allMetricRuns = sessionEvidence.flatMap((entry) => entry.metricRuns);
	const aggregateMetrics = computeSessionGoalMetrics(allMetricRuns);
	const latestMetrics = sessionEvidence[0]?.metrics;
	const currentValues: Record<string, number | null> = {
		reactionTime: aggregateMetrics.reactionTime,
		maxG: aggregateMetrics.maxG,
		peakSpeed: aggregateMetrics.peakSpeed,
		elapsedTime: aggregateMetrics.elapsedTime,
		accelerationPhase: aggregateMetrics.accelerationPhase,
		consistency: latestMetrics?.consistency ?? null,
		endurance: latestMetrics?.endurance ?? null
	};

	const enrichedGoals = (goals ?? []).map((goal) => {
		const projection = goalEvidence[goal.id];
		return {
			...goal,
			goal_milestones: projection?.milestones ?? goal.goal_milestones,
			computed_current: (projection?.currentValue ?? goal.current_value) as number | null
		};
	});

	// This cross-session signal is retained only as an input to optional goal
	// adaptation. Goals no longer presents it as a medical or injury assessment;
	// Progress owns the rider-facing longitudinal recovery/training-load view.
	let healthCheck: ReturnType<typeof performHealthCheck> | null = null;
	if ((sessions ?? []).length >= 10) {
		// The anomaly/fatigue service expects chronological history. The query is
		// newest-first for page convenience, so explicitly reverse a copy here.
		const chronological = [...sessionEvidence].reverse();

		const performanceData = {
			metric: 'reactionTime',
			lowerIsBetter: true,
			dataPoints: chronological
				.flatMap((entry) =>
					entry.reactions.map((value) => ({
						sessionId: entry.session.id,
						value,
						timestamp: entry.session.timestamp
					}))
				)
				.slice(-50)
		};

		const sessionHistory = chronological
			.filter((entry) => entry.reactions.length > 0)
			.map((entry) => ({
				sessionId: entry.session.id,
				timestamp: entry.session.timestamp,
				bestValue: Math.min(...entry.reactions),
				avgValue:
					entry.reactions.reduce((sum, value) => sum + value, 0) / entry.reactions.length,
				// fatigueAnalysis expects variability (CV), where a larger value is
				// worse. Do not feed the rider-facing 100-CV consistency score here.
				consistency: reactionCvPercent(entry.reactions),
				runCount: entry.eligibleRunCount,
				sessionFocus: entry.session.session_focus ?? null
			}));

		try {
			healthCheck = performHealthCheck(performanceData, sessionHistory);
		} catch (error) {
			console.error('Health check error:', error);
			healthCheck = null;
		}
	}

	// One canonical collection leaves the server. Evidence-derived values,
	// interpretation, prediction and optional adaptations cannot drift simply
	// because the page picked the wrong parallel array.
	const goalViewModels = enrichedGoals.map((goal) => {
		const current = goal.computed_current ?? goal.current_value ?? goal.start_value;
		const lowerIsBetter =
			goal.metric === 'reactionTime' ||
			goal.metric === 'elapsedTime' ||
			goal.metric === 'accelerationPhase';

		const milestones = Array.isArray(goal.goal_milestones) ? goal.goal_milestones : [];
		const sessionDataPoints = milestones
			.filter((milestone) => milestone && milestone.value !== undefined && milestone.achieved_at)
			.sort(
				(a: any, b: any) =>
					new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime()
			)
			.map((milestone, index) => ({
				sessionNumber: index + 1,
				value: milestone.value
			}));

		if (current !== null) {
			sessionDataPoints.push({
				sessionNumber: sessionDataPoints.length + 1,
				value: current
			});
		}

		const prediction =
			sessionDataPoints.length >= 2 && current !== null
				? predictGoalProgress(sessionDataPoints, goal.target_value, current, lowerIsBetter)
				: null;

		let adaptiveAnalysis = null;
		let progressStatus: 'way_ahead' | 'ahead' | 'on_track' | 'behind' | 'way_behind' | 'stalled' =
			'on_track';
		let percentComplete = 0;

		if (
			current !== null &&
			goal.start_value !== null &&
			goal.target_value !== null &&
			goal.deadline
		) {
			try {
				adaptiveAnalysis = analyzeGoalAdaptation(
					{
						metric: goal.metric,
						startValue: goal.start_value,
						targetValue: goal.target_value,
						currentValue: current,
						startDate: new Date(goal.created_at),
						deadline: new Date(goal.deadline),
						lowerIsBetter
					},
					{ sessionsRemaining: prediction?.sessionsRemaining ?? null },
					{ shouldRest: healthCheck?.shouldRest ?? false }
				);

				progressStatus = adaptiveAnalysis.progressEvaluation.status;
				percentComplete = adaptiveAnalysis.progressEvaluation.percentageComplete;
			} catch (error) {
				console.error('Goal adaptation analysis error:', error);
				const start = goal.start_value;
				const target = goal.target_value;
				const denominator = lowerIsBetter ? start - target : target - start;
				const numerator = lowerIsBetter ? start - current : current - start;
				percentComplete =
					denominator === 0
						? 0
						: Math.min(100, Math.max(0, (numerator / denominator) * 100));
			}
		}

		return {
			...goal,
			prediction,
			progressStatus,
			percentComplete,
			adaptiveAnalysis
		};
	});

	return {
		goals: goalViewModels,
		sessionCount: sessions?.length ?? 0,
		currentValues,
		healthCheck
	};
};

export const actions: Actions = {
	createGoal: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { createError: 'Not authenticated' });

		const form = await request.formData();
		const metric = form.get('metric') as string;
		let target_value = parseFloat(form.get('target_value') as string);
		let start_value = parseFloat(form.get('start_value') as string);
		const deadline = form.get('deadline') as string;
		const distance_m = form.get('distance_m')
			? parseFloat(form.get('distance_m') as string)
			: null;

		if (!metric || isNaN(target_value) || isNaN(start_value) || !deadline) {
			return fail(400, { createError: 'All required fields must be filled in' });
		}

		// Rider-facing reaction inputs are seconds; canonical storage is ms.
		if (metric === 'reactionTime') {
			target_value *= 1000;
			start_value *= 1000;
		}

		// Rider-facing speed inputs are km/h; goal evidence is stored in m/s.
		if (metric === 'peakSpeed') {
			target_value /= 3.6;
			start_value /= 3.6;
		}

		const { error } = await supabase.from('training_goals').insert({
			user_id: user.id,
			metric,
			target_value,
			start_value,
			current_value: start_value,
			deadline,
			distance_m
		});

		if (error) return fail(500, { createError: error.message });
		return { createSuccess: true };
	},

	deleteGoal: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { deleteError: 'Not authenticated' });

		const form = await request.formData();
		const goalId = form.get('goal_id') as string;

		const { error } = await supabase
			.from('training_goals')
			.delete()
			.eq('id', goalId)
			.eq('user_id', user.id);

		if (error) return fail(500, { deleteError: error.message });
		return { deleteSuccess: true };
	},

	completeGoal: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401);

		const form = await request.formData();
		const goalId = form.get('goal_id') as string;

		const { error } = await supabase
			.from('training_goals')
			.update({ completed_at: new Date().toISOString() })
			.eq('id', goalId)
			.eq('user_id', user.id);

		if (error) return fail(500, { completeError: error.message });
		return { completeSuccess: true };
	},

	applySuggestion: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { adjustError: 'Not authenticated' });

		const form = await request.formData();
		const goalId = form.get('goal_id') as string;
		const adjustmentType = form.get('adjustment_type') as string;
		const newValue = form.get('new_value') as string;

		if (!goalId || !adjustmentType) {
			return fail(400, { adjustError: 'Missing required fields' });
		}

		let updateData: any;

		switch (adjustmentType) {
			case 'increase_target':
			case 'decrease_target':
				updateData = { target_value: parseFloat(newValue) };
				break;

			case 'extend_deadline':
			case 'shorten_deadline':
				updateData = { deadline: newValue };
				break;

			case 'complete':
				updateData = { completed_at: new Date().toISOString() };
				break;

			case 'pause':
				return fail(501, {
					adjustError:
						"Goal pause is not yet available. If you need a break, you can delete and recreate the goal when you're ready to resume."
				});

			case 'cancel': {
				const { error: deleteError } = await supabase
					.from('training_goals')
					.delete()
					.eq('id', goalId)
					.eq('user_id', user.id);

				if (deleteError) return fail(500, { adjustError: deleteError.message });
				return { adjustSuccess: true, message: 'Goal removed' };
			}

			default:
				return fail(400, { adjustError: 'Unknown adjustment type' });
		}

		const { error } = await supabase
			.from('training_goals')
			.update(updateData)
			.eq('id', goalId)
			.eq('user_id', user.id);

		if (error) return fail(500, { adjustError: error.message });
		return { adjustSuccess: true, message: 'Goal adjusted successfully!' };
	}
};

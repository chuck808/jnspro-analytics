import type { PageServerLoad } from './$types';
import { buildSessionSummaries } from '$lib/server/sessionSummaryBuilder';
import { buildGoalEvidenceProjections } from '$lib/server/goalEvidenceProjection';
import { shouldExcludeFromStats } from '$lib/types/runs';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();

	const empty = {
		sessionCount: 0,
		totalRuns: 0,
		personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null },
		consistency: null,
		activeGoals: [],
		recentSessions: []
	};

	if (!profile) return empty;

	const { data: sessions, error: sessionsError } = await supabase
		.from('sessions')
		.select(
			`
			id,
			timestamp,
			runs(
				id,
				tags,
				elapsed_time_ms,
				gate_runs(
					reaction_time_ms,
					peak_speed_ms,
					max_g,
					analytics_valid
				)
			)
		`
		)
		.eq('user_id', profile.id)
		.eq('archived', false)
		.eq('session_type', 'gate')
		.order('timestamp', { ascending: false });

	if (sessionsError) {
		console.error('[Dashboard] Failed to load sessions:', sessionsError);
		return empty;
	}

	if (!sessions || sessions.length === 0) return empty;

	const summaries = buildSessionSummaries(sessions as any);
	const summaryById = new Map(summaries.map((summary) => [summary.id, summary]));

	const eligibleGateRuns = sessions.flatMap((session) =>
		(session.runs ?? [])
			.filter((run) => !shouldExcludeFromStats(run.tags as any))
			.flatMap((run) =>
				Array.isArray(run.gate_runs)
					? run.gate_runs
					: run.gate_runs
						? [run.gate_runs]
						: []
			)
	);

	const reactionTimes = eligibleGateRuns
		.map((run) => run.reaction_time_ms)
		.filter((value): value is number => value !== null);
	const validGateRuns = eligibleGateRuns.filter((run) => run.analytics_valid);
	const speeds = validGateRuns
		.map((run) => run.peak_speed_ms)
		.filter((value): value is number => value !== null);
	const gForces = eligibleGateRuns
		.map((run) => run.max_g)
		.filter((value): value is number => value !== null);

	const personalBests = {
		reaction_ms: reactionTimes.length ? Math.min(...reactionTimes) : null,
		peak_speed_ms: speeds.length ? Math.max(...speeds) : null,
		max_g: gForces.length ? Math.max(...gForces) : null
	};

	let consistency: number | null = null;
	if (reactionTimes.length >= 3) {
		const mean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
		const std = Math.sqrt(
			reactionTimes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / reactionTimes.length
		);
		consistency = mean > 0 ? (std / mean) * 100 : null;
	}

	const totalRuns = sessions.reduce((total, session) => total + (session.runs?.length ?? 0), 0);

	const recentSessions = sessions.slice(0, 5).map((session) => {
		const summary = summaryById.get(session.id);
		return {
			id: session.id,
			timestamp: session.timestamp,
			run_count: summary?.run_count ?? 0,
			best_reaction_ms: summary?.best_reaction_ms ?? null,
			best_peak_speed_ms: summary?.best_peak_speed_ms ?? null,
			has_valid_speed: summary?.has_valid_speed ?? false,
			reaction_cv: summary?.reaction_cv ?? null
		};
	});

	const { data: goals, error: goalsError } = await supabase
		.from('training_goals')
		.select('id, metric, target_value, start_value, current_value, deadline, created_at, distance_m')
		.eq('user_id', profile.id)
		.is('completed_at', null)
		.order('deadline', { ascending: true })
		.limit(3);

	if (goalsError) {
		console.error('[Dashboard] Failed to load active goals:', goalsError);
	}

	let goalEvidence: Awaited<ReturnType<typeof buildGoalEvidenceProjections>> = {};
	if (goals && goals.length > 0) {
		try {
			goalEvidence = await buildGoalEvidenceProjections(
				supabase,
				profile.id,
				goals.map((goal) => ({
					id: goal.id,
					metric: goal.metric,
					start_value: goal.start_value,
					created_at: goal.created_at,
					distance_m: goal.distance_m
				}))
			);
		} catch (projectionError) {
			console.warn('[Dashboard] Goal evidence projection failed:', projectionError);
		}
	}

	const now = new Date();
	const activeGoals = (goals ?? []).map((goal) => {
		const deadline = goal.deadline ? new Date(goal.deadline) : null;
		const daysUntil = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : 999;
		const start = goal.start_value ?? 0;
		const target = goal.target_value ?? 0;
		const current = goalEvidence[goal.id]?.currentValue ?? goal.current_value ?? start;
		const range = Math.abs(target - start);
		const progress =
			range > 0 ? Math.min(100, Math.round((Math.abs(current - start) / range) * 100)) : 0;

		return {
			...goal,
			current_value: current,
			daysUntilDeadline: daysUntil,
			isOverdue: daysUntil < 0,
			progress
		};
	});

	return {
		sessionCount: sessions.length,
		totalRuns,
		personalBests,
		consistency,
		activeGoals,
		recentSessions
	};
};

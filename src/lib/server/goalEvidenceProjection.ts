import type { SupabaseClient } from '@supabase/supabase-js';
import { shouldExcludeFromStats } from '$lib/types/runs';
import { computeSessionGoalMetrics } from '$lib/server/sessionGoalMetrics';
import { isSignificantImprovement } from '$lib/server/goalMilestones';

export interface GoalProjectionInput {
	id: string;
	metric: string;
	start_value: number | null;
	created_at: string;
	completed_at?: string | null;
	distance_m?: number | null;
}

export interface DerivedGoalMilestone {
	id: string;
	value: number;
	achieved_at: string;
}

export interface GoalEvidenceProjection {
	currentValue: number | null;
	milestones: DerivedGoalMilestone[];
}

export interface GoalEvidenceSession {
	id: string;
	timestamp: string;
	runs: any[];
}

function lowerIsBetter(metric: string): boolean {
	return ['reactionTime', 'elapsedTime', 'accelerationPhase'].includes(metric);
}

function isImprovement(metric: string, candidate: number, current: number): boolean {
	return lowerIsBetter(metric) ? candidate < current : candidate > current;
}

/** Pure projection used by the server loader and unit tests. */
export function projectGoalEvidenceFromSessions(
	goals: GoalProjectionInput[],
	orderedSessions: GoalEvidenceSession[]
): Record<string, GoalEvidenceProjection> {
	const result: Record<string, GoalEvidenceProjection> = {};

	for (const goal of goals) {
		let currentValue = goal.start_value;
		let milestoneBaseline = goal.start_value;
		const milestones: DerivedGoalMilestone[] = [];

		for (const session of orderedSessions) {
			if (session.timestamp < goal.created_at) continue;
			if (goal.completed_at && session.timestamp > goal.completed_at) break;

			let eligibleRuns = (session.runs ?? []).filter(
				(run: any) => !shouldExcludeFromStats(run.tags as any)
			);

			// Elapsed-time goals can be distance-specific. Only compare like-for-like
			// when a distance was supplied with the goal.
			if (goal.metric === 'elapsedTime' && goal.distance_m != null) {
				eligibleRuns = eligibleRuns.filter(
					(run: any) => run.distance_m != null && Math.abs(run.distance_m - goal.distance_m!) < 0.01
				);
			}

			const metricRuns = eligibleRuns.flatMap((run: any) => {
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

			const sessionMetrics = computeSessionGoalMetrics(metricRuns, eligibleRuns.length);
			const candidate = sessionMetrics[goal.metric as keyof typeof sessionMetrics];
			if (candidate == null) continue;

			if (currentValue == null) {
				currentValue = candidate;
				milestoneBaseline = candidate;
				continue;
			}

			if (!isImprovement(goal.metric, candidate, currentValue)) continue;

			// Current value is the best eligible evidence, regardless of whether the
			// change is large enough to deserve a milestone marker.
			currentValue = candidate;

			if (
				milestoneBaseline != null &&
				isImprovement(goal.metric, candidate, milestoneBaseline) &&
				isSignificantImprovement(goal.metric, milestoneBaseline, candidate, 0.5)
			) {
				milestones.push({
					id: `derived-${goal.id}-${session.id}`,
					value: candidate,
					achieved_at: session.timestamp
				});
				milestoneBaseline = candidate;
			}
		}

		result[goal.id] = { currentValue, milestones };
	}

	return result;
}

/**
 * Rebuild goal current values and milestones from canonical eligible evidence.
 *
 * The projection is intentionally derived at read time rather than mutating
 * goal_milestones. This makes a later run reclassification reversible: if a PB
 * becomes a warm-up/testing run, it simply disappears from the next projection.
 * Completed goals are frozen at completed_at so later evidence cannot rewrite
 * the historical state shown to riders, parents or coaches.
 */
export async function buildGoalEvidenceProjections(
	supabase: SupabaseClient,
	userId: string,
	goals: GoalProjectionInput[]
): Promise<Record<string, GoalEvidenceProjection>> {
	if (goals.length === 0) return {};

	const earliestGoal = goals.reduce(
		(earliest, goal) => (goal.created_at < earliest ? goal.created_at : earliest),
		goals[0].created_at
	);

	const { data: sessions, error } = await supabase
		.from('sessions')
		.select(
			`
			id,
			timestamp,
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
		.eq('user_id', userId)
		.eq('archived', false)
		.eq('session_type', 'gate')
		.gte('timestamp', earliestGoal)
		.order('timestamp', { ascending: true });

	if (error) {
		throw new Error(`Failed to build goal evidence projection: ${error.message}`);
	}

	return projectGoalEvidenceFromSessions(goals, (sessions ?? []) as GoalEvidenceSession[]);
}

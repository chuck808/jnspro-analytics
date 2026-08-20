/**
 * Goal milestone significance utilities.
 *
 * Historical note: goal milestone rows and training_goals.current_value used to
 * be mutated incrementally from upload/session-detail paths. Goal truth is now
 * derived from canonical eligible evidence, with persisted current_value kept in
 * sync by the reconciliation service. The compatibility function below remains
 * temporarily because the session layout still calls it, but it intentionally
 * performs no writes.
 */

interface GoalImprovement {
	goalId: string;
	metric: string;
	previousValue: number;
	newValue: number;
	improved: boolean;
}

/**
 * Legacy compatibility shim.
 *
 * Do not mutate goal_milestones/current_value here. Session loads must be
 * side-effect free; derived goal history is produced by goalEvidenceProjection
 * and stored current values are owned by reconcileGoalCurrentValues().
 */
export async function processGoalImprovements(
	_supabase: unknown,
	_improvements: GoalImprovement[],
	_timestamp?: string
): Promise<number> {
	return 0;
}

/**
 * Check if a new value represents a significant improvement.
 *
 * This remains useful for presentation (for example, deciding whether a session
 * improvement is notable enough to highlight) even though milestone persistence
 * is no longer incremental.
 */
export function isSignificantImprovement(
	metric: string,
	previousValue: number,
	newValue: number,
	threshold: number = 0.5
): boolean {
	const lowerIsBetter = ['reactionTime', 'elapsedTime', 'accelerationPhase'].includes(metric);

	const improvementPercent = lowerIsBetter
		? ((previousValue - newValue) / previousValue) * 100
		: ((newValue - previousValue) / previousValue) * 100;

	return improvementPercent >= threshold;
}

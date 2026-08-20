import type { SupabaseClient } from '@supabase/supabase-js';
import { buildGoalEvidenceProjections } from '$lib/server/goalEvidenceProjection';

/**
 * Rebuild the persisted current_value for all of a rider's goals from canonical
 * eligible evidence. The richer milestone history remains derived at read time;
 * this stored summary exists for limited projections such as coach views that do
 * not have permission to read the rider's raw sessions.
 */
export async function reconcileGoalCurrentValues(
	admin: SupabaseClient,
	userId: string
): Promise<void> {
	const { data: goals, error: goalsError } = await admin
		.from('training_goals')
		.select('id, metric, start_value, current_value, created_at, distance_m')
		.eq('user_id', userId);

	if (goalsError) {
		throw new Error(`Failed to load goals for reconciliation: ${goalsError.message}`);
	}
	if (!goals || goals.length === 0) return;

	const projections = await buildGoalEvidenceProjections(
		admin,
		userId,
		goals.map((goal) => ({
			id: goal.id,
			metric: goal.metric,
			start_value: goal.start_value,
			created_at: goal.created_at,
			distance_m: goal.distance_m
		}))
	);

	for (const goal of goals) {
		const projected = projections[goal.id]?.currentValue ?? goal.start_value;
		if (projected === goal.current_value) continue;

		const { error: updateError } = await admin
			.from('training_goals')
			.update({ current_value: projected, updated_at: new Date().toISOString() })
			.eq('id', goal.id)
			.eq('user_id', userId);

		if (updateError) {
			throw new Error(`Failed to reconcile goal ${goal.id}: ${updateError.message}`);
		}
	}
}

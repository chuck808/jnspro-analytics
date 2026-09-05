import type { PageServerLoad } from './$types';
import { load as loadAnalytics } from '../analytics/+page.server';
import { buildGoalEvidenceProjections } from '$lib/server/goalEvidenceProjection';

export const load: PageServerLoad = async (event) => {
	const data = (await loadAnalytics(event as any)) as any;
	if (!data?.profile) return data;

	const { data: goals, error } = await event.locals.supabase
		.from('training_goals')
		.select('id, metric, target_value, start_value, current_value, deadline, distance_m, created_at, completed_at')
		.eq('user_id', data.profile.id)
		.is('completed_at', null);

	if (error || !goals) return data;

	let projection: Awaited<ReturnType<typeof buildGoalEvidenceProjections>> = {};
	try {
		projection = await buildGoalEvidenceProjections(
			event.locals.supabase,
			data.profile.id,
			goals.map((goal) => ({
				id: goal.id,
				metric: goal.metric,
				start_value: goal.start_value,
				created_at: goal.created_at,
				completed_at: goal.completed_at,
				distance_m: goal.distance_m
			}))
		);
	} catch (projectionError) {
		console.warn('[Progress] Goal evidence projection failed, using persisted fallback:', projectionError);
	}

	const goalTargets = goals.reduce(
		(acc, goal) => {
			acc[goal.metric] = {
				target: goal.target_value,
				start: goal.start_value,
				current: projection[goal.id]?.currentValue ?? goal.current_value,
				deadline: goal.deadline
			};
			return acc;
		},
		{} as Record<
			string,
			{ target: number | null; start: number | null; current: number | null; deadline: string | null }
		>
	);

	return { ...data, goalTargets };
};

import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import type { GoalWithProfile } from '$lib/types/queries';

const LOWER_IS_BETTER_METRICS = ['reactionTime', 'elapsedTime', 'accelerationPhase'];

export const load: PageServerLoad = async () => {
	const admin = createSupabaseAdminClient();

	// Fetch all goals with user data
	const { data: goals } = await admin
		.from('training_goals')
		.select(`
			id,
			user_id,
			metric,
			target_value,
			start_value,
			current_value,
			deadline,
			completed,
			completed_at,
			created_at,
			updated_at,
			profiles!inner(name, email)
		`)
		.order('created_at', { ascending: false });

	// Fetch gate sessions only (not archived) for overtraining detection.
	// Previously fetched all sessions regardless of type or archived status.
	const { data: sessions } = await admin
		.from('sessions')
		.select('id, user_id, timestamp, archived')
		.eq('session_type', 'gate')
		.eq('archived', false)
		.order('timestamp', { ascending: false });

	// Calculate goal statistics
	const activeGoals = goals?.filter((g) => !g.completed) || [];
	const completedGoals = goals?.filter((g) => g.completed) || [];
	const usersWithGoals = new Set(goals?.map((g) => g.user_id) || []).size;

	// Group sessions by user
	const sessionsByUser = (sessions || []).reduce<Record<string, any[]>>((acc, s) => {
		if (!acc[s.user_id]) acc[s.user_id] = [];
		acc[s.user_id].push(s);
		return acc;
	}, {});

	const healthWarnings = {
		critical: 0,
		warning: 0,
		caution: 0
	};

	const usersAtRisk: any[] = [];
	const recentGoalActivity: any[] = [];

	// Analyze recent goal activity (last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	activeGoals.forEach((goal: any) => {
		const userSessions = sessionsByUser[goal.user_id] || [];
		const recentSessions = userSessions.filter(
			(s) => new Date(s.timestamp) >= thirtyDaysAgo
		);

		const sessionsLast7Days = userSessions.filter(
			(s) => new Date(s.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		);

		// Flag overtraining (>5 gate sessions in 7 days)
		if (sessionsLast7Days.length > 5) {
			healthWarnings.warning++;
			usersAtRisk.push({
				user_id: goal.user_id,
				user_email: goal.profiles?.email || 'Unknown',
				user_name: goal.profiles?.name || 'Unknown',
				risk_type: 'overtraining',
				sessions_count: sessionsLast7Days.length,
				goal_metric: goal.metric
			});
		}

		// Direction-aware progress calculation.
		// For lower-is-better metrics (reaction time etc), progress means
		// current_value going DOWN toward target.
		const lowerIsBetter = LOWER_IS_BETTER_METRICS.includes(goal.metric);
		const start   = goal.start_value ?? 0;
		const target  = goal.target_value ?? 0;
		const current = goal.current_value ?? start;

		let progress = 0;
		if (start !== target) {
			progress = Math.min(100, Math.max(0,
				lowerIsBetter
					? ((start - current) / (start - target)) * 100
					: ((current - start) / (target - start)) * 100
			));
		}

		recentGoalActivity.push({
			goal_id: goal.id,
			user_email: goal.profiles?.email || 'Unknown',
			user_name: goal.profiles?.name || 'Unknown',
			metric: goal.metric,
			progress: Math.round(progress),
			deadline: goal.deadline,
			recent_sessions: recentSessions.length,
			created_at: goal.created_at
		});
	});

	// Model stats — removed simulated values.
	// Track actual model selections when predictions are generated.
	const modelStats = null;

	// Calculate completion rate
	const totalGoals = (goals || []).length;
	const completionRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;

	// Average time to complete
	const completedWithDates = completedGoals.filter((g) => g.created_at && g.updated_at);
	const avgDaysToComplete =
		completedWithDates.length > 0
			? completedWithDates.reduce((sum, g) => {
					const days = Math.floor(
						(new Date(g.updated_at!).getTime() - new Date(g.created_at).getTime()) /
							(1000 * 60 * 60 * 24)
					);
					return sum + days;
				}, 0) / completedWithDates.length
			: 0;

	return {
		stats: {
			totalGoals: goals?.length || 0,
			activeGoals: activeGoals.length,
			completedGoals: completedGoals.length,
			usersWithGoals,
			completionRate: Math.round(completionRate),
			avgDaysToComplete: Math.round(avgDaysToComplete)
		},
		healthWarnings,
		usersAtRisk: usersAtRisk.slice(0, 10),
		recentGoalActivity: recentGoalActivity.slice(0, 20),
		modelStats,
		goals: goals || []
	};
};
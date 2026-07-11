import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { shouldExcludeFromStats } from '$lib/types/runs';
import {
	shapeLeaderboard,
	METRIC_COLUMN,
	METRIC_LOWER_IS_BETTER,
	type LeaderboardMetric,
	type TimePeriod,
	type LeaderboardViewRow
} from '$lib/services/benchmarking/leaderboards';

// Minimum opted-in riders before cross-rider rankings are surfaced.
// Below this the distribution is too thin to be meaningful.
const MIN_LEADERBOARD_RIDERS = 10;

export const load: PageServerLoad = async ({ locals: { supabase }, parent, url }) => {
	const { profile } = await parent();
	const admin = createSupabaseAdminClient();

	// ── Query params ──────────────────────────────────────────────────────────
	const selectedMetric = (url.searchParams.get('metric') ?? 'reactionTime') as LeaderboardMetric;
	const selectedPeriod = (url.searchParams.get('period') ?? 'all_time') as TimePeriod;
	const selectedAge = url.searchParams.get('ageGroup') ?? undefined;
	const selectedExp = url.searchParams.get('experience') ?? undefined;

	// ── User's own stats (always real, not gated) ─────────────────────────────
	const empty = {
		sessionCount: 0,
		totalRuns: 0,
		personalBests: {
			reaction_ms: null as number | null,
			peak_speed_ms: null as number | null,
			max_g: null as number | null
		},
		consistency: null as number | null,
		activeGoals: [] as any[],
		recentSessions: [] as any[],
		leaderboards: null as Record<string, any> | null,
		selectedMetric,
		selectedPeriod,
		userOptedIn: false,
		userDisplayName: null as string | null
	};

	if (!profile) return empty;

	const { data: sessions } = await supabase
		.from('sessions')
		.select('id, timestamp')
		.eq('user_id', profile.id)
		.eq('archived', false)
		.eq('session_type', 'gate')
		.order('timestamp', { ascending: false });

	if (!sessions || sessions.length === 0) return { ...empty };

	const sessionIds = sessions.map((s) => s.id);

	const { data: runsWithGate } = await supabase
		.from('runs')
		.select('tags, gate_runs(reaction_time_ms, peak_speed_ms, max_g, analytics_valid)')
		.in('session_id', sessionIds);

	const eligibleRuns = (runsWithGate ?? []).filter((r) => !shouldExcludeFromStats(r.tags as any));
	const allGateRuns = eligibleRuns.flatMap((r) =>
		Array.isArray(r.gate_runs) ? r.gate_runs : r.gate_runs ? [r.gate_runs] : []
	);
	const validGateRuns = allGateRuns.filter((g) => g.analytics_valid);

	const reactionTimes = allGateRuns
		.map((g) => g.reaction_time_ms)
		.filter((v): v is number => v !== null);
	const speeds = validGateRuns.map((g) => g.peak_speed_ms).filter((v): v is number => v !== null);
	const gForces = allGateRuns.map((g) => g.max_g).filter((v): v is number => v !== null);

	const personalBests = {
		reaction_ms: reactionTimes.length ? Math.min(...reactionTimes) : null,
		peak_speed_ms: speeds.length ? Math.max(...speeds) : null,
		max_g: gForces.length ? Math.max(...gForces) : null
	};

	let consistency: number | null = null;
	if (reactionTimes.length >= 3) {
		const mean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
		const std = Math.sqrt(
			reactionTimes.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / reactionTimes.length
		);
		consistency = (std / mean) * 100;
	}

	const { count: totalRuns } = await supabase
		.from('runs')
		.select('id', { count: 'exact', head: true })
		.in('session_id', sessionIds);

	// ── Leaderboard preference ────────────────────────────────────────────────
	const { data: prefs } = await supabase
		.from('user_preferences')
		.select('show_on_leaderboard, leaderboard_display_name')
		.eq('user_id', profile.id)
		.maybeSingle();

	const userOptedIn = prefs?.show_on_leaderboard ?? false;
	const userDisplayName = prefs?.leaderboard_display_name ?? null;

	// ── Leaderboard data (admin client, reads leaderboard_view) ───────────────
	// Check how many riders are opted in. If below threshold, surface null so
	// the UI shows the "not enough riders yet" state instead of rankings.
	const { count: optedInCount } = await admin
		.from('rider_performance_snapshots')
		.select('user_id', { count: 'exact', head: true })
		.eq('show_on_leaderboard', true);

	let leaderboards: Record<string, any> | null = null;

	if ((optedInCount ?? 0) >= MIN_LEADERBOARD_RIDERS) {
		// Build a query for each metric. Time-period filtering is not yet
		// implemented at the snapshot level (snapshots store all-time bests).
		// Week/month filters will be wired once we add a scored_at timestamp
		// per metric to rider_performance_snapshots.
		const metrics: LeaderboardMetric[] = ['reactionTime', 'peakSpeed', 'maxG', 'consistency'];

		const results = await Promise.all(
			metrics.map((metric) => {
				const col = METRIC_COLUMN[metric] as string;
				const lowerBetter = METRIC_LOWER_IS_BETTER[metric];

				let q = admin
					.from('leaderboard_view')
					.select(
						'user_id, display_name, age_group, experience_level, session_count, best_reaction_ms, best_peak_speed_ms, best_max_g, best_consistency'
					)
					.not(col, 'is', null)
					.order(col, { ascending: lowerBetter })
					.limit(200);

				if (selectedAge) q = (q as any).eq('age_group', selectedAge);
				if (selectedExp) q = (q as any).eq('experience_level', selectedExp);

				return q.then(({ data }) => ({
					metric,
					rows: (data ?? []) as LeaderboardViewRow[]
				}));
			})
		);

		leaderboards = {};
		for (const { metric, rows } of results) {
			leaderboards[metric] = shapeLeaderboard(
				rows,
				{
					metric,
					timePeriod: selectedPeriod,
					ageGroup: selectedAge as any,
					experienceLevel: selectedExp as any
				},
				profile.id
			);
		}
	}

	// ── Recent sessions ───────────────────────────────────────────────────────
	const recentIds = sessions.slice(0, 5).map((s) => s.id);
	const { data: recentRuns } = await supabase
		.from('runs')
		.select('session_id, tags, gate_runs(reaction_time_ms, peak_speed_ms, analytics_valid)')
		.in('session_id', recentIds);
	const { data: recentRunCounts } = await supabase
		.from('runs')
		.select('session_id, id')
		.in('session_id', recentIds);

	const recentSessions = sessions.slice(0, 5).map((session) => {
		const sessionEligible = (recentRuns ?? []).filter(
			(r) => r.session_id === session.id && !shouldExcludeFromStats(r.tags as any)
		);
		const sGateRuns = sessionEligible
			.flatMap((r) => (Array.isArray(r.gate_runs) ? r.gate_runs : r.gate_runs ? [r.gate_runs] : []))
			.filter((g) => g.analytics_valid);
		const sReactions = sessionEligible
			.flatMap((r) => (Array.isArray(r.gate_runs) ? r.gate_runs : r.gate_runs ? [r.gate_runs] : []))
			.map((g) => g.reaction_time_ms)
			.filter((v): v is number => v !== null);
		const sSpeeds = sGateRuns.map((r) => r.peak_speed_ms).filter((v): v is number => v !== null);
		const sRunCount = (recentRunCounts ?? []).filter((r) => r.session_id === session.id).length;
		let reaction_cv: number | null = null;
		if (sReactions.length >= 3) {
			const mean = sReactions.reduce((a, b) => a + b, 0) / sReactions.length;
			const std = Math.sqrt(
				sReactions.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / sReactions.length
			);
			reaction_cv = (std / mean) * 100;
		}
		return {
			id: session.id,
			timestamp: session.timestamp,
			run_count: sRunCount,
			best_reaction_ms: sReactions.length ? Math.min(...sReactions) : null,
			best_peak_speed_ms: sSpeeds.length ? Math.max(...sSpeeds) : null,
			has_valid_speed: sSpeeds.length > 0,
			reaction_cv
		};
	});

	// ── Goals ─────────────────────────────────────────────────────────────────
	const { data: goals } = await supabase
		.from('training_goals')
		.select('id, metric, target_value, start_value, current_value, deadline')
		.eq('user_id', profile.id)
		.eq('completed', false)
		.order('deadline', { ascending: true })
		.limit(3);

	const now = new Date();
	const lowerBetterMetrics = ['reactionTime', 'elapsedTime', 'accelerationPhase'];
	const activeGoals = (goals ?? []).map((goal) => {
		const deadline = goal.deadline ? new Date(goal.deadline) : null;
		const daysUntil = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : 999;
		const start = goal.start_value ?? 0;
		const target = goal.target_value ?? 0;
		const current = goal.current_value ?? start;
		const lowerBetter = lowerBetterMetrics.includes(goal.metric);
		let progress = 0;
		if (start !== target) {
			progress = Math.min(
				100,
				Math.max(
					0,
					Math.round(
						lowerBetter
							? ((start - current) / (start - target)) * 100
							: ((current - start) / (target - start)) * 100
					)
				)
			);
		}
		return { ...goal, daysUntilDeadline: daysUntil, isOverdue: daysUntil < 0, progress };
	});

	return {
		sessionCount: sessions.length,
		totalRuns: totalRuns ?? 0,
		personalBests,
		consistency,
		activeGoals,
		recentSessions,
		leaderboards,
		selectedMetric,
		selectedPeriod,
		selectedAgeGroup: selectedAge,
		selectedExperience: selectedExp,
		userOptedIn,
		userDisplayName,
		profile
	};
};

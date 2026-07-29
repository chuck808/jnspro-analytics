// +layout.server.ts  –  /sessions/[id]/
//
// Single data load shared by all three child routes:
//   /sessions/[id]             → Overview
//   /sessions/[id]/analysis    → Analysis
//   /sessions/[id]/detail      → Deep Dive

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { processGoalImprovements, isSignificantImprovement } from '$lib/server/goalMilestones';
import { computeSessionGoalMetrics } from '$lib/server/sessionGoalMetrics';
import { buildSessionSummaries } from '$lib/server/sessionSummaryBuilder';
import { shouldExcludeFromStats } from '$lib/types/runs';
import { computeSessionStats } from '$lib/performance-engine/sessionStatsAggregate';

function getMetricLabel(metric: string): string {
	const labels: Record<string, string> = {
		reactionTime: 'Reaction Time',
		maxG: 'Peak G-Force',
		peakSpeed: 'Peak Speed',
		consistency: 'Consistency',
		elapsedTime: 'Elapsed Time',
		accelerationPhase: 'Acceleration Phase',
		endurance: 'Gates per Session'
	};
	return labels[metric] ?? metric;
}

export const load: LayoutServerLoad = async ({ locals: { supabase }, parent, params }) => {
	const { profile } = await parent();
	if (!profile) throw error(401, 'Not authenticated');

	const { data: session, error: sessionError } = await supabase
		.from('sessions')
		.select(
			`
            id,
            session_type,
            timestamp,
            notes,
            archived,
            weather_conditions,
            track_surface,
            session_focus,
            ride_feel,
            bikes(
                id,
                name,
                weight_kg,
                crank_length_mm,
                chainring_teeth,
                sprocket_teeth,
                front_tire:tire_library!bikes_front_tire_id_fkey(brand, model, size, diameter_inches),
                rear_tire:tire_library!bikes_rear_tire_id_fkey(brand, model, size, diameter_inches)
            ),
            rider_profiles(
                height_cm,
                weight_kg,
                rider_level,
                date_of_birth,
                sex
            )
        `
		)
		.eq('id', params.id)
		.eq('user_id', profile.id)
		.single();

	if (sessionError || !session) {
		throw error(404, 'Session not found');
	}

	// Load all runs with gate analytics and timeseries
	const { data: runs, error: runsError } = await supabase
		.from('runs')
		.select(
			`
            id,
            run_number,
            elapsed_time_ms,
            distance_m,
            chart_data,
            tags,
            gate_runs(
                reaction_time_ms,
                max_g,
                avg_g,
                speed_ms,
                peak_speed_ms,
                avg_speed_ms_calc,
                time_to_peak_speed_ms,
                bias_correction_ms2,
                analytics_valid,
                max_pitch_deg,
                avg_pitch_deg,
                pitch_at_peak_g_deg,
                time_to_wheelie_ms,
                wheelie_duration_ms,
                front_wheel_lifted
            ),
            run_timeseries(
                sample_rate_hz,
                sample_count,
                pitch_deg,
                roll_deg,
                linear_accel_g
            ),
            run_videos(
                id,
                storage_path,
                filename,
                mime_type,
                duration_ms,
                sync_offset_s,
                status,
                created_at
            )
        `
		)
		.eq('session_id', params.id)
		.order('run_number', { ascending: true });

	if (runsError) {
		throw error(500, 'Failed to load runs');
	}

	// Mint signed URLs for any attached videos — most runs won't have one, so
	// this stays cheap. Foundation-slice rough edge: signed URLs expire (1hr);
	// a tab left open past that will 403 on replay until reloaded.
	for (const run of runs ?? []) {
		const video = (run as any).run_videos;
		if (video?.storage_path) {
			const { data: signedUrlData } = await supabase.storage
				.from('run-videos')
				.createSignedUrl(video.storage_path, 3600);
			video.signed_url = signedUrlData?.signedUrl ?? null;
		}
	}

	// Compute session-level summary stats
	// Filter runs: exclude warmup and explicitly excluded runs
	const allRuns = runs ?? [];
	const includedRuns = allRuns.filter((r) => !shouldExcludeFromStats(r.tags as any));

	const sessionStats = computeSessionStats(allRuns);

	// Fetch active goals to check if this session improved any metrics
	const { data: goals } = await supabase
		.from('training_goals')
		.select('id, metric, target_value, start_value, current_value, deadline')
		.eq('user_id', profile.id)
		.is('completed_at', null);

	// Calculate current metric values from this session using the shared utility.
	// Map from includedRuns so we can access both runs.elapsed_time_ms and gate_runs fields.
	const sessionMetrics = computeSessionGoalMetrics(
		includedRuns.flatMap((r) => {
			const gates = Array.isArray(r.gate_runs) ? r.gate_runs : r.gate_runs ? [r.gate_runs] : [];
			return gates.map((g) => ({
				reaction_time_ms: g.reaction_time_ms,
				max_g: g.max_g,
				peak_speed_ms: g.peak_speed_ms ?? null,
				elapsed_time_ms: (r as any).elapsed_time_ms ?? null,
				time_to_peak_speed_ms: g.time_to_peak_speed_ms ?? null,
				analytics_valid: g.analytics_valid
			}));
		}),
		includedRuns.length
	);

	// Check which goals were improved by this session
	const improvements: Array<{
		goalId: string;
		metric: string;
		previousValue: number;
		newValue: number;
		improved: boolean;
	}> = [];

	const goalProgress = (goals ?? [])
		.map((goal) => {
			const sessionValue = sessionMetrics[goal.metric as keyof typeof sessionMetrics] ?? null;
			const previousValue = goal.current_value;

			if (sessionValue === null || previousValue === null) return null;

			// Determine if this is an improvement based on metric direction
			const lowerIsBetter = ['reactionTime', 'elapsedTime', 'accelerationPhase'].includes(
				goal.metric
			);
			const improved = lowerIsBetter ? sessionValue < previousValue : sessionValue > previousValue;

			// Check if improvement is significant enough for a milestone
			const isSignificant =
				improved &&
				isSignificantImprovement(
					goal.metric,
					previousValue,
					sessionValue,
					0.5 // 0.5% minimum improvement threshold
				);

			if (isSignificant) {
				improvements.push({
					goalId: goal.id,
					metric: goal.metric,
					previousValue,
					newValue: sessionValue,
					improved: true
				});
			}

			if (!improved) return null;

			// Calculate progress toward goal
			const start = goal.start_value ?? 0;
			const target = goal.target_value ?? 0;
			const progress =
				start !== target
					? Math.min(
							100,
							Math.max(
								0,
								lowerIsBetter
									? ((start - sessionValue) / (start - target)) * 100
									: ((sessionValue - start) / (target - start)) * 100
							)
						)
					: 0;

			return {
				goalId: goal.id,
				metric: goal.metric,
				metricLabel: getMetricLabel(goal.metric),
				improvement: lowerIsBetter
					? `${(((previousValue - sessionValue) / previousValue) * 100).toFixed(1)}% faster`
					: `${(((sessionValue - previousValue) / previousValue) * 100).toFixed(1)}% higher`,
				percentToGoal: Math.round(progress),
				newValue: sessionValue,
				isSignificant // Flag for significant improvements (milestone created)
			};
		})
		.filter(Boolean);

	// Auto-create milestones for significant improvements
	if (improvements.length > 0) {
		await processGoalImprovements(supabase, improvements, session.timestamp);
	}

	// ── ALL-TIME PERSONAL BESTS ──
	// Query all user's sessions to find all gate runs.
	// Excludes the current session — without this, the session's own best run
	// gets folded into the pool it's compared against, making a genuine new PB
	// mathematically impossible to detect (strict < / > against a self-inclusive pool).
	const { data: allUserSessions } = await supabase
		.from('sessions')
		.select('id')
		.eq('user_id', profile.id)
		.eq('session_type', 'gate')
		.neq('id', params.id);

	const allSessionIds = (allUserSessions ?? []).map((s) => s.id);

	// Get all gate runs from user's sessions.
	// tags is included so warmup and excluded runs can be filtered out —
	// a warmup run with a fast reaction time should not count as a personal best.
	const { data: allUserRuns } = await supabase
		.from('runs')
		.select(
			`
            tags,
            gate_runs(
                reaction_time_ms,
                max_g,
                peak_speed_ms,
                analytics_valid
            )
        `
		)
		.in('session_id', allSessionIds);

	const allTimeGateRuns = (allUserRuns ?? [])
		.filter((r) => !shouldExcludeFromStats(r.tags as any))
		.map((r) => r.gate_runs)
		.flat()
		.filter(Boolean);

	const allTimePBs = {
		bestReactionMs:
			allTimeGateRuns.length > 0
				? Math.min(...allTimeGateRuns.map((g) => g!.reaction_time_ms).filter((v) => v !== null))
				: null,
		bestMaxG:
			allTimeGateRuns.length > 0
				? Math.max(...allTimeGateRuns.map((g) => g!.max_g).filter((v) => v !== null))
				: null,
		bestSpeedMs:
			allTimeGateRuns.length > 0
				? Math.max(
						...allTimeGateRuns
							.filter((g) => g!.analytics_valid)
							.map((g) => g!.peak_speed_ms)
							.filter((v) => v !== null)
					)
				: null,
		// Session-level intelligence (consistency CV, session quality) isn't
		// persisted per-session yet, so these can't be computed across history.
		// The achievement detector handles null gracefully.
		bestConsistencyCv: null as number | null,
		bestSessionQuality: null as number | null
	};

	// ── ADVANCED ANALYTICS: Load recent sessions for cross-session analysis ──
	const { data: recentSessions } = await supabase
		.from('sessions')
		.select('id, timestamp, weather_conditions, track_surface, session_focus, ride_feel')
		.eq('user_id', profile.id)
		.eq('session_type', 'gate')
		.eq('archived', false)
		.order('timestamp', { ascending: false })
		.limit(30);

	const recentSessionIds = (recentSessions ?? []).map((s) => s.id);

	// Load all runs from recent sessions for advanced analytics.
	// tags is included so shouldExcludeFromStats can filter warmup and
	// excluded runs from cross-session calculations.
	const { data: allRecentRuns } = await supabase
		.from('runs')
		.select(
			`
            id,
            session_id,
            tags,
            gate_runs(
                reaction_time_ms,
                max_g,
                peak_speed_ms,
                analytics_valid,
                bias_correction_ms2,
                front_wheel_lifted
            )
        `
		)
		.in('session_id', recentSessionIds);

	// Build session summaries using the shared utility — same computation as
	// the analytics page so both surfaces always produce identical values.
	const sessionSummaries = buildSessionSummaries(
		(recentSessions ?? []).map((s) => ({
			...s,
			runs: (allRecentRuns ?? []).filter((r) => r.session_id === s.id)
		})) as any
	);

	// Flatten stats-eligible runs only for cross-run analysis
	const allRunsData = (allRecentRuns ?? [])
		.filter((r) => !shouldExcludeFromStats(r.tags as any))
		.flatMap((r) =>
			(Array.isArray(r.gate_runs) ? r.gate_runs : r.gate_runs ? [r.gate_runs] : []).map((g) => ({
				session_id: r.session_id,
				reaction_time_ms: g.reaction_time_ms,
				peak_speed_ms: g.peak_speed_ms,
				max_g: g.max_g,
				analytics_valid: g.analytics_valid,
				bias_correction_ms2: g.bias_correction_ms2,
				front_wheel_lifted: g.front_wheel_lifted
			}))
		);

	// ── SESSION NOTES ──
	// Load notes for this session
	const { data: sessionNotes } = await supabase
		.from('session_notes')
		.select(
			`
            id,
            session_id,
            user_id,
            note_type,
            content,
            created_at,
            updated_at,
            author_role
        `
		)
		.eq('session_id', params.id)
		.order('created_at', { ascending: false });

	// ── PREVIOUS SESSION DATA (for comparison modal) ──
	// Find the session immediately before this one
	const { data: previousSession } = await supabase
		.from('sessions')
		.select(
			`
            id,
            timestamp,
            bikes(name)
        `
		)
		.eq('user_id', profile.id)
		.eq('session_type', 'gate')
		.lt('timestamp', session.timestamp)
		.order('timestamp', { ascending: false })
		.limit(1)
		.single();

	// If there's a previous session, load its summary stats
	let previousSessionSummary = null;
	if (previousSession) {
		const { data: prevRuns } = await supabase
			.from('runs')
			.select('gate_runs(reaction_time_ms, max_g, peak_speed_ms, analytics_valid)')
			.eq('session_id', previousSession.id);

		const prevGateRuns = (prevRuns ?? [])
			.map((r) => r.gate_runs)
			.flat()
			.filter(Boolean);

		const prevValidRuns = prevGateRuns.filter((g) => g!.analytics_valid);
		const prevReactionTimes = prevGateRuns
			.map((g) => g!.reaction_time_ms)
			.filter((v) => v !== null);

		const prevBestReaction = prevReactionTimes.length > 0 ? Math.min(...prevReactionTimes) : null;
		const prevAvgReaction =
			prevReactionTimes.length > 0
				? prevReactionTimes.reduce((a, b) => a + b, 0) / prevReactionTimes.length
				: null;

		const prevReactionCv =
			prevReactionTimes.length > 1 && prevAvgReaction
				? (() => {
						const variance =
							prevReactionTimes.reduce((s, t) => s + Math.pow(t - prevAvgReaction, 2), 0) /
							prevReactionTimes.length;
						return (Math.sqrt(variance) / prevAvgReaction) * 100;
					})()
				: null;

		previousSessionSummary = {
			id: previousSession.id,
			timestamp: previousSession.timestamp,
			run_count: prevGateRuns.length,
			best_reaction_ms: prevBestReaction,
			avg_reaction_ms: prevAvgReaction,
			best_max_g: prevGateRuns.length > 0 ? Math.max(...prevGateRuns.map((g) => g!.max_g)) : null,
			best_peak_speed_ms:
				prevValidRuns.length > 0
					? Math.max(...prevValidRuns.map((g) => g!.peak_speed_ms ?? 0))
					: null,
			reaction_cv: prevReactionCv,
			bike_name:
				previousSession.bikes &&
				typeof previousSession.bikes === 'object' &&
				'name' in previousSession.bikes
					? previousSession.bikes.name
					: null,
			weather: null, // Would need to add to query if tracked
			surface: null
		};
	}

	// ── USER PREFERENCES (for social card image display) ──────────────────────
	const { data: userPreferences } = await supabase
		.from('user_preferences')
		.select('show_profile_icon, show_background_image')
		.eq('user_id', profile.id)
		.maybeSingle();

	// ── ACTIVE COACH LINKS (for the "Send to Coach" report action) ────────────
	const { data: coachLinkRows } = await supabase
		.from('coach_rider_links')
		.select('id, coach_id')
		.eq('rider_id', profile.id)
		.eq('status', 'active');

	const coachIds = (coachLinkRows ?? []).map((l) => l.coach_id);
	const { data: coachProfiles } =
		coachIds.length > 0
			? await supabase.from('profiles').select('id, name').in('id', coachIds)
			: { data: [] };
	const coachNameById = new Map((coachProfiles ?? []).map((c) => [c.id, c.name]));

	const coachLinks = (coachLinkRows ?? []).map((l) => ({
		linkId: l.id,
		coachName: coachNameById.get(l.coach_id) ?? 'Coach'
	}));

	return {
		coachLinks,
		session,
		runs: runs ?? [],
		analysisRuns: includedRuns, // stats-eligible runs only — use for all engine/analysis calls
		sessionStats,
		sessionNotes: sessionNotes ?? [],
		previousSessionSummary, // For comparison modal
		// Pass rider + bike data for analytics
		riderWeight:
			session.rider_profiles &&
			typeof session.rider_profiles === 'object' &&
			'weight_kg' in session.rider_profiles
				? session.rider_profiles.weight_kg
				: null,
		bikeWeight:
			session.bikes && typeof session.bikes === 'object' && 'weight_kg' in session.bikes
				? session.bikes.weight_kg
				: null,
		crankLength:
			session.bikes && typeof session.bikes === 'object' && 'crank_length_mm' in session.bikes
				? session.bikes.crank_length_mm
				: null,
		// Goal progress
		goalProgress: goalProgress.filter((g): g is NonNullable<typeof g> => g !== null),
		hasActiveGoals: (goals ?? []).length > 0,
		// All-time personal bests
		allTimePBs,
		// Advanced analytics data
		advancedAnalytics: {
			sessions: sessionSummaries,
			allRuns: allRunsData,
			sessionCount: recentSessions?.length ?? 0
		},
		// User preferences for social card
		userPreferences: {
			show_profile_icon: userPreferences?.show_profile_icon ?? true,
			show_background_image: userPreferences?.show_background_image ?? true
		}
	};
};

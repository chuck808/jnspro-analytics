import type { SupabaseClient } from '@supabase/supabase-js';
import { shouldExcludeFromStats } from '$lib/types/runs';
import { upsertSnapshot } from '$lib/services/benchmarking';
import {
	determineAgeGroup,
	estimateExperienceLevel
} from '$lib/services/benchmarking/peerComparison';
import { getUCICategory } from '$lib/utils/uciCategories';

/**
 * Rebuild the rider's persisted benchmarking snapshot from canonical session/run evidence.
 *
 * This is intentionally transport-agnostic: manual upload, device/Wi-Fi ingest and later
 * eligibility changes should all converge here instead of relying on "the next upload".
 */
export async function reconcilePerformanceSnapshot(
	admin: SupabaseClient,
	userId: string
): Promise<void> {
	const [sessionsResult, prefsResult, riderProfileResult, profileResult] = await Promise.all([
		admin
			.from('sessions')
			.select('id')
			.eq('user_id', userId)
			.eq('archived', false)
			.eq('session_type', 'gate'),
		admin
			.from('user_preferences')
			.select('show_on_leaderboard, leaderboard_display_name')
			.eq('user_id', userId)
			.maybeSingle(),
		admin
			.from('rider_profiles')
			.select('date_of_birth, weight_kg')
			.eq('user_id', userId)
			.order('effective_from', { ascending: false })
			.limit(1)
			.maybeSingle(),
		admin.from('profiles').select('participation_type').eq('id', userId).maybeSingle()
	]);

	if (sessionsResult.error) {
		throw new Error(`Failed to load sessions for snapshot reconciliation: ${sessionsResult.error.message}`);
	}

	const sessionIds = (sessionsResult.data ?? []).map((session) => session.id);
	const sessionCount = sessionIds.length;

	let allRunsData: any[] = [];
	if (sessionIds.length > 0) {
		const runsResult = await admin
			.from('runs')
			.select('tags, gate_runs(reaction_time_ms, peak_speed_ms, max_g, analytics_valid)')
			.in('session_id', sessionIds);

		if (runsResult.error) {
			throw new Error(`Failed to load runs for snapshot reconciliation: ${runsResult.error.message}`);
		}
		allRunsData = runsResult.data ?? [];
	}

	const eligibleRuns = allRunsData.filter((run) => !shouldExcludeFromStats(run.tags as any));
	const allGate = eligibleRuns.flatMap((run) =>
		Array.isArray(run.gate_runs) ? run.gate_runs : run.gate_runs ? [run.gate_runs] : []
	);
	const validGate = allGate.filter((gate: any) => gate.analytics_valid);

	const reactions = allGate
		.map((gate: any) => gate.reaction_time_ms)
		.filter((value: any): value is number => value != null);
	const speeds = validGate
		.map((gate: any) => gate.peak_speed_ms)
		.filter((value: any): value is number => value != null);
	const gForces = allGate
		.map((gate: any) => gate.max_g)
		.filter((value: any): value is number => value != null);

	let consistency: number | null = null;
	if (reactions.length >= 3) {
		const mean = reactions.reduce((sum: number, value: number) => sum + value, 0) / reactions.length;
		const std = Math.sqrt(
			reactions.reduce((sum: number, value: number) => sum + (value - mean) ** 2, 0) /
				reactions.length
		);
		consistency = mean > 0 ? Math.max(0, 100 - (std / mean) * 100) : null;
	}

	const riderProfile = riderProfileResult.data;
	let ageGroup: ReturnType<typeof determineAgeGroup> | 'unknown' = 'unknown';
	let uciCategory: string | null = null;
	if (riderProfile?.date_of_birth) {
		const dob = new Date(riderProfile.date_of_birth);
		const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
		ageGroup = determineAgeGroup(age);
		uciCategory = getUCICategory(riderProfile.date_of_birth)?.shortName ?? null;
	}

	const experienceLevel = estimateExperienceLevel(sessionCount, 50);
	const prefs = prefsResult.data;

	await upsertSnapshot(admin, {
		userId,
		bestReactionMs: reactions.length ? Math.min(...reactions) : null,
		bestPeakSpeedMs: speeds.length ? Math.max(...speeds) : null,
		bestMaxG: gForces.length ? Math.max(...gForces) : null,
		bestConsistency: consistency,
		sessionCount,
		totalRuns: allGate.length,
		ageGroup,
		uciCategory,
		experienceLevel,
		participationType: profileResult.data?.participation_type ?? null,
		showOnLeaderboard: prefs?.show_on_leaderboard ?? false,
		displayName: prefs?.leaderboard_display_name ?? null
	});
}

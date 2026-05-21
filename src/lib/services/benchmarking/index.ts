/**
 * Benchmarking Service
 *
 * Peer comparison and leaderboard system.
 *
 * Key functions used by server code:
 *   fetchBenchmarkForMetric()   — reads real percentile distributions from
 *                                 performance_aggregates. Returns null when
 *                                 sample size is below MIN_BENCHMARK_SAMPLE.
 *   upsertSnapshot()            — called from upload API after each ingest.
 *                                 Updates rider_performance_snapshots and
 *                                 triggers refresh_performance_aggregates().
 *
 * Key functions used by client code (page.svelte):
 *   compareToPeers()            — pure calculation, unchanged. Receives the
 *                                 PerformanceBenchmark returned by the server.
 *   isBenchmarkingAvailable()   — checks sample size before showing UI.
 */

export * from './peerComparison';
export * from './leaderboards';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
	compareToPeers,
	determineAgeGroup,
	estimateExperienceLevel,
	type PeerComparisonResult,
	type PerformanceBenchmark,
	type AgeGroup,
	type ExperienceLevel,
} from './peerComparison';

// ── Constants ─────────────────────────────────────────────────────────────────

// Must match the _min_sample in refresh_performance_aggregates() SQL, but
// the application enforces a higher bar (30) so early data doesn't mislead.
export const MIN_BENCHMARK_SAMPLE = 30;

// ── Snapshot upsert ───────────────────────────────────────────────────────────

export interface SnapshotInput {
	userId:             string;
	bestReactionMs:     number | null;
	bestPeakSpeedMs:    number | null;
	bestMaxG:           number | null;
	bestConsistency:    number | null;
	sessionCount:       number;
	totalRuns:          number;
	// Derived from rider_profiles.date_of_birth at call time
	ageGroup:           AgeGroup | 'unknown';
	// UCI category derived from date_of_birth (e.g. 'elite', 'youth', 'cadet')
	uciCategory:        string | null;
	// Derived from session count + performance relative to current distribution
	experienceLevel:    ExperienceLevel;
	// Copied from profiles.participation_type
	participationType:  string | null;
	showOnLeaderboard:  boolean;
	displayName:        string | null;
}

/**
 * Upsert the rider's performance snapshot and refresh aggregates.
 * Call this from the upload API after a successful ingest.
 * Uses the admin (service-role) client.
 */
export async function upsertSnapshot(
	adminClient: SupabaseClient,
	input: SnapshotInput
): Promise<void> {
	const { error: upsertError } = await adminClient
		.from('rider_performance_snapshots')
		.upsert({
			user_id:             input.userId,
			best_reaction_ms:    input.bestReactionMs,
			best_peak_speed_ms:  input.bestPeakSpeedMs,
			best_max_g:          input.bestMaxG,
			best_consistency:    input.bestConsistency,
			age_group:           input.ageGroup,
			uci_category:        input.uciCategory,
			experience_level:    input.experienceLevel,
			participation_type:  input.participationType,
			session_count:       input.sessionCount,
			total_runs:          input.totalRuns,
			show_on_leaderboard: input.showOnLeaderboard,
			display_name:        input.displayName,
			updated_at:          new Date().toISOString(),
		}, { onConflict: 'user_id' });

	if (upsertError) {
		// Non-fatal — log and continue. The upload itself succeeded.
		console.error('[benchmarking] snapshot upsert failed:', upsertError.message);
		return;
	}

	// Refresh aggregate distributions. This is a cheap scan of the snapshots
	// table (~milliseconds) not a scan of gate_runs.
	const { error: refreshError } = await adminClient.rpc('refresh_performance_aggregates');
	if (refreshError) {
		console.error('[benchmarking] aggregate refresh failed:', refreshError.message);
	}
}

// ── Fetch benchmark ───────────────────────────────────────────────────────────

/**
 * Fetch the percentile distribution for a metric from performance_aggregates.
 * Falls back through cohort levels: (age × exp) → (age, all) → (all, exp) → (all, all).
 * Returns null when the best available distribution has fewer than MIN_BENCHMARK_SAMPLE riders.
 */
export async function fetchBenchmarkForMetric(
	supabase:        SupabaseClient,
	metric:          'reaction_ms' | 'peak_speed_ms' | 'max_g' | 'consistency',
	ageGroup:        AgeGroup | 'unknown',
	experienceLevel: ExperienceLevel
): Promise<PerformanceBenchmark | null> {
	// Try progressively broader cohorts until one has enough data
	const candidates = [
		{ age: ageGroup === 'unknown' ? 'all' : ageGroup, exp: experienceLevel },
		{ age: ageGroup === 'unknown' ? 'all' : ageGroup, exp: 'all' },
		{ age: 'all',                                       exp: experienceLevel },
		{ age: 'all',                                       exp: 'all' },
	];

	for (const cohort of candidates) {
		const { data } = await supabase
			.from('performance_aggregates')
			.select('*')
			.eq('metric',           metric)
			.eq('age_group',        cohort.age)
			.eq('experience_level', cohort.exp)
			.maybeSingle();

		if (!data) continue;
		if (data.sample_size < MIN_BENCHMARK_SAMPLE) continue;

		return {
			metric,
			percentile_10: data.percentile_10,
			percentile_25: data.percentile_25,
			percentile_50: data.percentile_50,
			percentile_75: data.percentile_75,
			percentile_90: data.percentile_90,
			sampleSize:    data.sample_size,
			lastUpdated:   new Date(data.computed_at),
		};
	}

	return null;
}

// ── Full analysis (server-side) ───────────────────────────────────────────────

export interface BenchmarkingAnalysis {
	peerComparison:  PeerComparisonResult | null;
	leaderboardRank: number | null;
	isOptedIn:       boolean;
	privacyNote:     string;
	benchmarkAvailable: boolean;
}

/**
 * Full benchmarking analysis for a user. Call from page.server.ts.
 * supabase can be the user client (reads performance_aggregates via authenticated policy).
 */
export async function analyzeBenchmarking(
	supabase: SupabaseClient,
	userData: {
		userId:          string;
		age:             number;
		sessionCount:    number;
		currentValue:    number;
		metric:          'reaction_ms' | 'peak_speed_ms' | 'max_g' | 'consistency';
		lowerIsBetter:   boolean;
	}
): Promise<BenchmarkingAnalysis> {
	const ageGroup       = determineAgeGroup(userData.age);

	// For experience level we query the user's own snapshot to get the stored
	// level, which was computed against the real distribution at upload time.
	const { data: snap } = await supabase
		.from('rider_performance_snapshots')
		.select('experience_level, show_on_leaderboard')
		.eq('user_id', userData.userId)
		.maybeSingle();

	const experienceLevel = (snap?.experience_level as ExperienceLevel) ??
		estimateExperienceLevel(userData.sessionCount, 50);
	const isOptedIn       = snap?.show_on_leaderboard ?? false;

	const benchmark = await fetchBenchmarkForMetric(
		supabase,
		userData.metric,
		ageGroup,
		experienceLevel
	);

	if (!benchmark) {
		return {
			peerComparison:     null,
			leaderboardRank:    null,
			isOptedIn,
			privacyNote:        'Peer comparison will be available once there are enough riders in the system.',
			benchmarkAvailable: false,
		};
	}

	const peerComparison = compareToPeers(
		userData.currentValue,
		userData.metric,
		ageGroup,
		experienceLevel,
		benchmark,
		userData.lowerIsBetter
	);

	return {
		peerComparison,
		leaderboardRank:    null,  // filled by leaderboard page.server.ts from leaderboard_view
		isOptedIn,
		privacyNote:        isOptedIn
			? 'Your data is included in anonymised leaderboards.'
			: 'Opt in via Settings to see your global ranking.',
		benchmarkAvailable: true,
	};
}

export function isBenchmarkingAvailable(sampleSize: number): boolean {
	return sampleSize >= MIN_BENCHMARK_SAMPLE;
}
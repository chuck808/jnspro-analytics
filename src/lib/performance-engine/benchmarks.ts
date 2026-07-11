/**
 * Performance Benchmarks
 *
 * Thresholds used by the technique scoring engine to score runs against
 * reference values for each rider level.
 *
 * Source hierarchy (highest priority first):
 *   1. DB threshold_profiles table — auto-derived from real session data or
 *      manually set by admin. Read server-side via getBenchmarksFromDB().
 *   2. DEFAULT_BENCHMARKS below — hardcoded seed values used when:
 *        a) The DB table is empty or not yet populated
 *        b) The requested level has no DB record
 *        c) Client-side code calls getBenchmarks() synchronously
 *
 * The DB values replace DEFAULT_BENCHMARKS automatically once sufficient
 * rider data accumulates (see refresh_threshold_profiles() SQL function).
 * Admin can manually override any level via /admin/thresholds.
 *
 * Threshold confidence note:
 *   All values marked source='hardcoded' in the DB are provisional —
 *   informed by the limited BMX gate start literature and coaching
 *   experience, but not yet validated against a population dataset.
 *   The auto-derivation system will replace them as real data accumulates.
 */

import type { DetailLevel } from './types';

export type RiderBenchmarkLevel = DetailLevel | 'novice' | 'intermediate' | 'expert' | 'elite';

export interface PerformanceBenchmarks {
	reactionMs: {
		excellent: number;
		good: number;
		needsWork: number;
	};
	peakG: {
		good: number;
		excellent: number;
	};
	timeTo90ImpulseS: {
		excellent: number;
		good: number;
		needsWork: number;
	};
	smoothnessScore: {
		good: number;
		excellent: number;
	};
	speedCarryRatio: {
		good: number;
		excellent: number;
	};
	// Provenance — populated when read from DB, undefined for hardcoded fallback
	_source?: 'hardcoded' | 'auto' | 'manual' | 'manual_override';
	_sampleSize?: number | null;
	_computedAt?: string | null;
}

// ── Hardcoded fallback values ─────────────────────────────────────────────────
// These are the baseline thresholds. They seed the threshold_profiles table
// on first migration and remain as the client-side fallback.

export const DEFAULT_BENCHMARKS: Record<string, PerformanceBenchmarks> = {
	grom: {
		reactionMs: { excellent: 280, good: 380, needsWork: 520 },
		peakG: { good: 1.2, excellent: 1.8 },
		timeTo90ImpulseS: { excellent: 1.1, good: 1.5, needsWork: 2.0 },
		smoothnessScore: { good: 65, excellent: 82 },
		speedCarryRatio: { good: 0.72, excellent: 0.84 },
		_source: 'hardcoded'
	},
	rider: {
		reactionMs: { excellent: 230, good: 320, needsWork: 430 },
		peakG: { good: 1.8, excellent: 2.4 },
		timeTo90ImpulseS: { excellent: 0.95, good: 1.3, needsWork: 1.8 },
		smoothnessScore: { good: 68, excellent: 85 },
		speedCarryRatio: { good: 0.76, excellent: 0.88 },
		_source: 'hardcoded'
	},
	intermediate: {
		reactionMs: { excellent: 230, good: 320, needsWork: 430 },
		peakG: { good: 1.8, excellent: 2.4 },
		timeTo90ImpulseS: { excellent: 0.95, good: 1.3, needsWork: 1.8 },
		smoothnessScore: { good: 68, excellent: 85 },
		speedCarryRatio: { good: 0.76, excellent: 0.88 },
		_source: 'hardcoded'
	},
	expert: {
		reactionMs: { excellent: 200, good: 280, needsWork: 380 },
		peakG: { good: 2.1, excellent: 2.8 },
		timeTo90ImpulseS: { excellent: 0.85, good: 1.15, needsWork: 1.6 },
		smoothnessScore: { good: 72, excellent: 88 },
		speedCarryRatio: { good: 0.8, excellent: 0.9 },
		_source: 'hardcoded'
	},
	elite: {
		reactionMs: { excellent: 180, good: 250, needsWork: 340 },
		peakG: { good: 2.3, excellent: 3.0 },
		timeTo90ImpulseS: { excellent: 0.8, good: 1.05, needsWork: 1.45 },
		smoothnessScore: { good: 75, excellent: 90 },
		speedCarryRatio: { good: 0.82, excellent: 0.92 },
		_source: 'hardcoded'
	},
	coach: {
		reactionMs: { excellent: 180, good: 250, needsWork: 340 },
		peakG: { good: 2.3, excellent: 3.0 },
		timeTo90ImpulseS: { excellent: 0.8, good: 1.05, needsWork: 1.45 },
		smoothnessScore: { good: 75, excellent: 90 },
		speedCarryRatio: { good: 0.82, excellent: 0.92 },
		_source: 'hardcoded'
	}
};

// ── Synchronous fallback (client-side, no DB access) ─────────────────────────

export function getBenchmarks(level?: string | null): PerformanceBenchmarks {
	return DEFAULT_BENCHMARKS[level ?? 'rider'] ?? DEFAULT_BENCHMARKS.rider;
}

// ── DB-backed read (server-side) ──────────────────────────────────────────────

export interface ThresholdProfileRow {
	profile_level: string;
	reaction_ms_excellent: number;
	reaction_ms_good: number;
	reaction_ms_needs_work: number;
	peak_g_good: number;
	peak_g_excellent: number;
	impulse_90_excellent: number;
	impulse_90_good: number;
	impulse_90_needs_work: number;
	smoothness_good: number;
	smoothness_excellent: number;
	speed_carry_good: number;
	speed_carry_excellent: number;
	source: 'hardcoded' | 'auto' | 'manual' | 'manual_override';
	sample_size: number | null;
	computed_at: string | null;
	notes: string | null;
}

/**
 * Convert a DB row into a PerformanceBenchmarks object.
 */
export function rowToBenchmarks(row: ThresholdProfileRow): PerformanceBenchmarks {
	return {
		reactionMs: {
			excellent: row.reaction_ms_excellent,
			good: row.reaction_ms_good,
			needsWork: row.reaction_ms_needs_work
		},
		peakG: { good: row.peak_g_good, excellent: row.peak_g_excellent },
		timeTo90ImpulseS: {
			excellent: row.impulse_90_excellent,
			good: row.impulse_90_good,
			needsWork: row.impulse_90_needs_work
		},
		smoothnessScore: { good: row.smoothness_good, excellent: row.smoothness_excellent },
		speedCarryRatio: { good: row.speed_carry_good, excellent: row.speed_carry_excellent },
		_source: row.source,
		_sampleSize: row.sample_size,
		_computedAt: row.computed_at
	};
}

/**
 * Fetch all threshold profiles from the DB.
 * Returns a map of level → PerformanceBenchmarks.
 * Falls back to DEFAULT_BENCHMARKS for any level not in the DB.
 *
 * Call this from +page.server.ts or +layout.server.ts, then pass the result
 * down to client components. Never call from client-side code.
 */
export async function getAllBenchmarksFromDB(supabase: {
	from: (table: string) => any;
}): Promise<Record<string, PerformanceBenchmarks>> {
	const { data, error } = await supabase.from('threshold_profiles').select('*');

	if (error || !data || data.length === 0) {
		return { ...DEFAULT_BENCHMARKS };
	}

	const result: Record<string, PerformanceBenchmarks> = { ...DEFAULT_BENCHMARKS };
	for (const row of data as ThresholdProfileRow[]) {
		result[row.profile_level] = rowToBenchmarks(row);
		// Keep intermediate in sync with rider if not separately overridden
		if (
			row.profile_level === 'rider' &&
			!data.find((r: ThresholdProfileRow) => r.profile_level === 'intermediate')
		) {
			result['intermediate'] = rowToBenchmarks(row);
		}
	}
	return result;
}

/**
 * Fetch a single level from the DB.
 * Falls back to DEFAULT_BENCHMARKS[level] when not found.
 */
export async function getBenchmarksFromDB(
	supabase: { from: (table: string) => any },
	level: string
): Promise<PerformanceBenchmarks> {
	const dbLevel = level === 'intermediate' ? 'rider' : level;

	const { data } = await supabase
		.from('threshold_profiles')
		.select('*')
		.eq('profile_level', dbLevel)
		.maybeSingle();

	if (!data) {
		return DEFAULT_BENCHMARKS[level] ?? DEFAULT_BENCHMARKS.rider;
	}

	return rowToBenchmarks(data as ThresholdProfileRow);
}

// ── Scoring functions (unchanged) ─────────────────────────────────────────────

export function scoreAgainstLowerIsBetter(
	value: number | null | undefined,
	excellent: number,
	needsWork: number
): number | null {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;
	if (value <= excellent) return 100;
	if (value >= needsWork) return 35;
	const ratio = (needsWork - value) / (needsWork - excellent);
	return Math.round(35 + ratio * 65);
}

export function scoreAgainstHigherIsBetter(
	value: number | null | undefined,
	good: number,
	excellent: number
): number | null {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;
	if (value >= excellent) return 100;
	if (value <= 0) return 0;
	if (value < good) return Math.round(Math.max(25, (value / good) * 70));
	const ratio = (value - good) / (excellent - good);
	return Math.round(70 + ratio * 30);
}

export function labelScore(
	score: number | null | undefined
): 'excellent' | 'good' | 'developing' | 'needs-work' | 'unknown' {
	if (score === null || score === undefined) return 'unknown';
	if (score >= 85) return 'excellent';
	if (score >= 70) return 'good';
	if (score >= 55) return 'developing';
	return 'needs-work';
}

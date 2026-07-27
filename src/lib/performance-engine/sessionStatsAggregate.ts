import { shouldExcludeFromStats } from '$lib/types/runs';

export interface SessionStats {
	run_count: number;
	included_run_count: number;
	excluded_run_count: number;
	best_reaction_ms: number | null;
	avg_reaction_ms: number | null;
	best_peak_speed_ms: number | null;
	avg_peak_speed_ms: number | null;
	best_max_g: number | null;
	reaction_cv: number | null;
	wheelie_count: number;
	has_valid_speed: boolean;
}

interface RunLike {
	tags?: unknown;
	gate_runs?: unknown;
}

/**
 * Session-level aggregate stats from a set of runs. Ported verbatim from the
 * logic that used to be inlined in +layout.server.ts — kept as the single
 * implementation so the server load and the client-side live preview can
 * never quietly drift apart.
 */
export function computeSessionStats(runs: RunLike[]): SessionStats {
	const allRuns = runs;
	const includedRuns = allRuns.filter((r) => !shouldExcludeFromStats(r.tags as any));
	const excludedCount = allRuns.length - includedRuns.length;

	const gateRuns = includedRuns
		.map((r) => r.gate_runs)
		.flat()
		.filter(Boolean) as any[];

	const validRuns = gateRuns.filter((g) => g!.analytics_valid);

	return {
		run_count: allRuns.length,
		included_run_count: includedRuns.length,
		excluded_run_count: excludedCount,
		best_reaction_ms:
			gateRuns.length > 0 ? Math.min(...gateRuns.map((g) => g!.reaction_time_ms)) : null,
		avg_reaction_ms:
			gateRuns.length > 0
				? gateRuns.reduce((s, g) => s + g!.reaction_time_ms, 0) / gateRuns.length
				: null,
		best_peak_speed_ms:
			validRuns.length > 0 ? Math.max(...validRuns.map((g) => g!.peak_speed_ms ?? 0)) : null,
		avg_peak_speed_ms:
			validRuns.length > 0
				? validRuns.reduce((s, g) => s + (g!.peak_speed_ms ?? 0), 0) / validRuns.length
				: null,
		best_max_g: gateRuns.length > 0 ? Math.max(...gateRuns.map((g) => g!.max_g)) : null,
		// Consistency — CV of reaction times (using filtered runs only)
		reaction_cv:
			gateRuns.length > 1
				? (() => {
						const times = gateRuns.map((g) => g!.reaction_time_ms);
						const mean = times.reduce((s, t) => s + t, 0) / times.length;
						const variance = times.reduce((s, t) => s + Math.pow(t - mean, 2), 0) / times.length;
						return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : null;
					})()
				: null,
		wheelie_count: gateRuns.filter((g) => g!.front_wheel_lifted).length,
		has_valid_speed: validRuns.length > 0
	};
}

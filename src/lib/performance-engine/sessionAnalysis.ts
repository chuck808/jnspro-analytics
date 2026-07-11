import { analyseRepeatability, type RunData } from './repeatability';
import { analyseFatigue } from './fatigue';

/**
 * Session Stability Analysis
 * Migrated from legacy analyticsExtended.ts
 */

export interface SessionStabilityResult {
	runNumber: number;
	stability: number;
	isBest: boolean;
}

export interface RunStabilityInput {
	run_number: number;
	chart_data: number[];
	elapsed_time_ms: number | null;
}

export function analyseSessionRuns(runs: RunData[]) {
	const repeatability = analyseRepeatability(runs);
	const speeds = runs
		.map((r) => r.peakSpeed)
		.filter((v): v is number => typeof v === 'number' && !isNaN(v));
	const fatigue = analyseFatigue(speeds);

	const consistency = repeatability.overall;

	return {
		consistency,
		repeatability,
		fatigue,
		recommendation: buildRecommendation(consistency, fatigue)
	};
}

function buildRecommendation(consistency: number, fatigue: any) {
	const rec = [];

	if (consistency < 60) {
		rec.push('Focus on repeatable starts rather than one-off efforts.');
	}

	if (fatigue.trend === 'declining') {
		rec.push('Performance drops across runs — reduce set length or increase recovery.');
	}

	if (consistency > 80 && fatigue.trend === 'stable') {
		rec.push('Excellent session quality - maintain this approach.');
	}

	return rec;
}

/**
 * Compute G-force stability in first 500ms
 * Migrated from legacy analyticsExtended.ts
 */
export function computeGForceStability(chartData: number[], elapsedMs: number): number | null {
	if (!chartData.length || !elapsedMs) return null;
	const samplesPerSecond = chartData.length / (elapsedMs / 1000);
	const window = Math.max(1, Math.round(0.5 * samplesPerSecond));
	const slice = chartData.slice(0, window);
	return slice.reduce((a, b) => a + Math.abs(b), 0) / slice.length;
}

/**
 * Compute session-wide G-force stability for cross-run comparison
 * Migrated from legacy analyticsExtended.ts
 */
export function computeSessionStability(runs: RunStabilityInput[]): SessionStabilityResult[] {
	const results = runs.map((r) => ({
		runNumber: r.run_number,
		stability: computeGForceStability(r.chart_data as number[], r.elapsed_time_ms ?? 2000) ?? 0,
		isBest: false
	}));

	const best = Math.max(...results.map((r) => r.stability));
	results.forEach((r) => {
		r.isBest = r.stability === best;
	});
	return results;
}

/**
 * Get stability insight for the current run
 * Provides context on how this run compares to session average
 */
export function getStabilityInsight(
	currentStability: number | null,
	sessionResults: SessionStabilityResult[]
): string {
	if (!currentStability || sessionResults.length < 2) {
		return 'Single run - no comparison available';
	}

	const avgStability =
		sessionResults.reduce((sum, r) => sum + r.stability, 0) / sessionResults.length;
	const bestStability = Math.max(...sessionResults.map((r) => r.stability));
	const pctOfBest = (currentStability / bestStability) * 100;
	const pctOfAvg = (currentStability / avgStability) * 100;

	if (pctOfBest >= 95) {
		return `Excellent first 500ms stability — this is your best start of the session at ${currentStability.toFixed(2)}G`;
	} else if (pctOfAvg >= 105) {
		return `Above-average stability (${pctOfAvg.toFixed(0)}% of session average) — consistent power application`;
	} else if (pctOfAvg >= 95) {
		return `Typical stability for this session — consistent with your average start`;
	} else {
		return `Below session average (${pctOfAvg.toFixed(0)}% of typical) — check body position and initial stroke timing`;
	}
}

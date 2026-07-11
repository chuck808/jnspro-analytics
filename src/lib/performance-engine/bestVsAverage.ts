/**
 * Best vs Average Run Analysis
 *
 * Solves the key problem:
 * - Riders judge themselves by BEST run
 * - Coaches judge by AVERAGE performance
 */

export interface BestVsAverageAnalysis {
	best: number;
	average: number;
	gap: number;
	gapPercent: number;
	consistencyType: 'consistent' | 'moderate' | 'inconsistent';
}

export function analyseBestVsAverage(values: number[]): BestVsAverageAnalysis | null {
	if (!values.length) return null;

	const best = Math.max(...values);
	const avg = values.reduce((a, b) => a + b, 0) / values.length;

	const gap = best - avg;
	const gapPercent = (gap / best) * 100;

	return {
		best,
		average: avg,
		gap,
		gapPercent,
		consistencyType: gapPercent < 5 ? 'consistent' : gapPercent < 10 ? 'moderate' : 'inconsistent'
	};
}

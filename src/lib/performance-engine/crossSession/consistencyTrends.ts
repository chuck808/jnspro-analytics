/**
 * Performance Engine v8.0 — Consistency Trends
 *
 * Answers: "Is consistency improving?"
 */

import { calculateTrend, extractMetric } from './trendUtils';
import type { SessionPerformanceSummary, ConsistencyTrends } from './types';

export function analyseConsistencyTrends(sessions: SessionPerformanceSummary[]): ConsistencyTrends {
	// Repeatability score: higher is better
	const repeatabilityValues = extractMetric(sessions, 'repeatabilityScore');
	const repeatabilityTrend = calculateTrend(repeatabilityValues, { higherIsBetter: true });

	// Best-vs-average gap: lower is better (smaller gap = more consistent)
	const gapValues = extractMetric(sessions, 'bestVsAvgGapPercent');
	const bestVsAverageGapTrend = calculateTrend(gapValues, { higherIsBetter: false });

	return {
		repeatabilityTrend,
		bestVsAverageGapTrend
	};
}

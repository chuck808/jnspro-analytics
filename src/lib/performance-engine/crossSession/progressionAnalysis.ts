/**
 * Performance Engine v8.0 — Performance Progression Analysis
 *
 * Answers: "Is performance improving?"
 */

import { calculateTrend, extractMetric } from './trendUtils';
import type { SessionPerformanceSummary, PerformanceProgression } from './types';

export function analysePerformanceProgression(
	sessions: SessionPerformanceSummary[]
): PerformanceProgression {
	// Speed: higher is better
	const speedValues = extractMetric(sessions, 'bestSpeedKmh');
	const speedTrend = calculateTrend(speedValues, { higherIsBetter: true });

	// Reaction time: lower is better
	const reactionValues = extractMetric(sessions, 'bestReactionTimeSec');
	const reactionTrend = calculateTrend(reactionValues, { higherIsBetter: false });

	// Peak G: higher is better
	const peakGValues = extractMetric(sessions, 'peakG');
	const peakGTrend = calculateTrend(peakGValues, { higherIsBetter: true });

	return {
		speedTrend,
		reactionTrend,
		peakGTrend
	};
}

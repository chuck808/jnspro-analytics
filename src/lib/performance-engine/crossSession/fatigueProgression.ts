/**
 * Performance Engine v8.0 — Fatigue/Capacity Progression
 *
 * Answers: "Is fatigue/work capacity improving or declining?"
 */

import { calculateTrend, extractMetric } from './trendUtils';
import type { SessionPerformanceSummary, FatigueProgression } from './types';

export function analyseFatigueProgression(
	sessions: SessionPerformanceSummary[]
): FatigueProgression {
	// Drop-off run: higher is better (fatigue appears later)
	const dropOffValues = extractMetric(sessions, 'dropOffRun');
	const dropOffTrend = calculateTrend(dropOffValues, { higherIsBetter: true });

	// Optimal set length: higher is better (can handle more quality runs)
	const setLengthValues = extractMetric(sessions, 'optimalSetLength');
	const optimalSetLengthTrend = calculateTrend(setLengthValues, { higherIsBetter: true });

	return {
		dropOffTrend,
		optimalSetLengthTrend
	};
}

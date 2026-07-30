/**
 * Shared builder for SessionPerformanceSummary — the cross-session-engine's
 * input shape. Previously built inline, separately, in both
 * src/routes/(protected)/analytics/+page.svelte and
 * src/routes/(protected)/sessions/[id]/+layout.svelte, and the two copies had
 * already drifted (the session-detail one was missing all four context
 * fields). This is the single place that shape gets assembled now — each call
 * site is still responsible for sourcing its own SessionIntelligenceReport
 * (the two routes get there via different paths), but the final object shape
 * is shared.
 */

import type { SessionIntelligenceReport } from '../sessionIntelligence';
import type { SessionPerformanceSummary } from './types';

export interface SessionPerformanceSummaryInput {
	sessionId: string;
	date: string | Date;
	runCount: number;
	bestReactionMs: number | null;
	avgReactionMs: number | null;
	bestPeakSpeedMs: number | null; // m/s — converted to km/h here
	avgPeakSpeedMs: number | null;
	bestMaxG: number | null;
	avgMaxG: number | null;
	weatherCondition?: string | null;
	trackSurface?: string | null;
	sessionFocus?: string | null;
	rideFeel?: string | null;
	bikeId?: number | null;
	riderProfileId?: number | null;
}

export function buildSessionPerformanceSummary(
	input: SessionPerformanceSummaryInput,
	intelligence: SessionIntelligenceReport | null
): SessionPerformanceSummary {
	return {
		sessionId: input.sessionId,
		date: input.date,
		runCount: input.runCount,

		sessionQuality: intelligence?.sessionQuality ?? null,
		repeatabilityScore: intelligence?.repeatability?.overall ?? null,
		bestVsAvgGapPercent: intelligence?.bestVsAvg?.gapPercent ?? null,
		dropOffRun: intelligence?.dropOff?.dropOffRun ?? null,
		optimalSetLength: intelligence?.setLength?.optimal ?? null,

		bestSpeedKmh: input.bestPeakSpeedMs ? input.bestPeakSpeedMs * 3.6 : null,
		avgSpeedKmh: input.avgPeakSpeedMs ? input.avgPeakSpeedMs * 3.6 : null,
		bestReactionTimeSec: input.bestReactionMs ? input.bestReactionMs / 1000 : null,
		avgReactionTimeSec: input.avgReactionMs ? input.avgReactionMs / 1000 : null,
		peakG: input.bestMaxG,
		avgPeakG: input.avgMaxG,

		weatherCondition: input.weatherCondition ?? null,
		trackSurface: input.trackSurface ?? null,
		sessionFocus: input.sessionFocus ?? null,
		rideFeel: input.rideFeel ?? null,

		bikeId: input.bikeId ?? null,
		riderProfileId: input.riderProfileId ?? null
	};
}

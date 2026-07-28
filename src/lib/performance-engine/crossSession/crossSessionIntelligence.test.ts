import { describe, expect, it } from 'vitest';
import { analyseCrossSessionIntelligence } from './crossSessionIntelligence';
import type { SessionPerformanceSummary } from './types';

function makeSession(
	index: number,
	overrides: Partial<SessionPerformanceSummary> = {}
): SessionPerformanceSummary {
	return {
		sessionId: `session-${index}`,
		date: new Date(2026, 0, index + 1).toISOString(),
		runCount: 8,
		sessionQuality: 70,
		repeatabilityScore: 70,
		bestVsAvgGapPercent: 8,
		dropOffRun: 6,
		optimalSetLength: 6,
		bestSpeedKmh: 30,
		avgSpeedKmh: 28,
		bestReactionTimeSec: 0.2,
		avgReactionTimeSec: 0.22,
		peakG: 1.2,
		avgPeakG: 1.0,
		weatherCondition: null,
		trackSurface: null,
		sessionFocus: null,
		rideFeel: null,
		...overrides
	};
}

describe('analyseCrossSessionIntelligence', () => {
	it('reports insufficient-data status below the minimum session count', () => {
		const sessions = [makeSession(0), makeSession(1)];
		const report = analyseCrossSessionIntelligence(sessions);

		expect(report.status).toBe('insufficient-data');
		expect(report.sessionCount).toBe(2);
		expect(report.overallTrend).toBe('unknown');
		expect(report.warnings[0]).toContain('Need at least 3 sessions');
	});

	it('classifies overallTrend as improving when speed, reaction, and repeatability all improve', () => {
		const sessions = [
			makeSession(0, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(1, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(2, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(3, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(4, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(5, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 })
		];

		const report = analyseCrossSessionIntelligence(sessions);

		expect(report.status).toBe('ready');
		expect(report.performance.speedTrend.improving).toBe(true);
		expect(report.performance.reactionTrend.improving).toBe(true);
		expect(report.consistency.repeatabilityTrend.improving).toBe(true);
		expect(report.overallTrend).toBe('improving');
	});

	it('classifies overallTrend as declining when speed, reaction, and repeatability all worsen', () => {
		const sessions = [
			makeSession(0, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(1, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(2, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(3, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(4, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(5, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 })
		];

		const report = analyseCrossSessionIntelligence(sessions);

		expect(report.status).toBe('ready');
		expect(report.performance.speedTrend.improving).toBe(false);
		expect(report.performance.reactionTrend.improving).toBe(false);
		expect(report.overallTrend).toBe('declining');
	});

	it('respects the lookbackSessions option when computing trends', () => {
		const sessions = Array.from({ length: 8 }, (_, i) => makeSession(i));
		const report = analyseCrossSessionIntelligence(sessions, { lookbackSessions: 4 });

		expect(report.lookbackSessions).toBe(4);
		expect(report.sessionCount).toBe(8);
	});
});

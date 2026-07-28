import { describe, expect, it } from 'vitest';
import { buildProgressReport } from './buildProgressReport';
import { buildProgressChartSeries } from './progressCharts';
import { analyseCrossSessionIntelligence } from '../performance-engine/crossSession';
import type { SessionPerformanceSummary } from '../performance-engine/crossSession/types';

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

describe('buildProgressReport', () => {
	it('shows an early-days headline below 3 sessions', () => {
		const report = buildProgressReport({ sessionCount: 2 });
		expect(report.summary.headline).toBe('Early days — keep building the picture.');
	});

	it('reflects an improving cross-session trend in the headline', () => {
		const sessions = [
			makeSession(0, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(1, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(2, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(3, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(4, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(5, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 })
		];
		const crossSessionReport = analyseCrossSessionIntelligence(sessions);

		const report = buildProgressReport({ sessionCount: sessions.length, crossSessionReport });

		expect(report.summary.headline).toContain('improving');
	});

	it('reflects a declining cross-session trend in the headline', () => {
		const sessions = [
			makeSession(0, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(1, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(2, { bestSpeedKmh: 35, bestReactionTimeSec: 0.15, repeatabilityScore: 90 }),
			makeSession(3, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(4, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 }),
			makeSession(5, { bestSpeedKmh: 25, bestReactionTimeSec: 0.25, repeatabilityScore: 50 })
		];
		const crossSessionReport = analyseCrossSessionIntelligence(sessions);

		const report = buildProgressReport({ sessionCount: sessions.length, crossSessionReport });

		expect(report.summary.headline.toLowerCase()).toContain('declining');
	});

	it('flows real chart data through to report.charts when charts are supplied', () => {
		const charts = buildProgressChartSeries([
			{
				sessionId: 's1',
				sessionIndex: 1,
				date: '2026-01-01',
				bestReactionTimeSec: 0.2,
				avgReactionTimeSec: 0.22,
				bestVsAvgGapPercent: 8,
				optimalSetLength: 6,
				dropOffRun: 7,
				runCount: 8
			},
			{
				sessionId: 's2',
				sessionIndex: 2,
				date: '2026-01-02',
				bestReactionTimeSec: 0.19,
				avgReactionTimeSec: 0.21,
				bestVsAvgGapPercent: 7,
				optimalSetLength: 7,
				dropOffRun: 8,
				runCount: 8
			}
		]);

		const report = buildProgressReport({ sessionCount: 2, charts });

		expect(report.charts.length).toBeGreaterThan(0);
		const reactionChart = report.charts.find((c) => c.id === 'reaction-time-trend');
		expect(reactionChart?.data?.length).toBe(2);
	});

	it('produces no charts when the caller supplies none — the original bug is not silently reintroduced', () => {
		const report = buildProgressReport({ sessionCount: 5 });
		expect(report.charts).toEqual([]);
	});
});

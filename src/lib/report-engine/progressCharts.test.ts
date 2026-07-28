import { describe, expect, it } from 'vitest';
import { buildProgressChartSeries, type ProgressChartSessionPoint } from './progressCharts';

function makePoint(
	index: number,
	overrides: Partial<ProgressChartSessionPoint> = {}
): ProgressChartSessionPoint {
	return {
		sessionId: `session-${index}`,
		sessionIndex: index,
		date: `2026-01-0${index}`,
		bestReactionTimeSec: 0.2,
		avgReactionTimeSec: 0.22,
		bestVsAvgGapPercent: 8,
		optimalSetLength: 6,
		dropOffRun: 7,
		runCount: 8,
		...overrides
	};
}

describe('buildProgressChartSeries', () => {
	it('maps core fields (reaction, gap, set length, drop-off) into chart points', () => {
		const charts = buildProgressChartSeries([makePoint(1), makePoint(2), makePoint(3)]);

		const reaction = charts.find((c) => c.id === 'reaction-time-trend');
		expect(reaction?.data).toEqual([
			{ x: 1, y: 0.22, label: 'best 0.200s' },
			{ x: 2, y: 0.22, label: 'best 0.200s' },
			{ x: 3, y: 0.22, label: 'best 0.200s' }
		]);

		const gap = charts.find((c) => c.id === 'best-vs-average-gap-trend');
		expect(gap?.data?.every((p) => p.y === 8)).toBe(true);

		const setLength = charts.find((c) => c.id === 'optimal-set-length-trend');
		expect(setLength?.data?.every((p) => p.y === 6)).toBe(true);

		const dropOff = charts.find((c) => c.id === 'drop-off-position-trend');
		expect(dropOff?.data?.every((p) => p.y === 7)).toBe(true);
	});

	it('omits a chart entirely when its backing field is undefined for every session', () => {
		const points = [makePoint(1), makePoint(2)]; // no techniqueOverall/smoothness/power/etc. set
		const charts = buildProgressChartSeries(points);

		expect(charts.find((c) => c.id === 'technique-quality-trend')).toBeUndefined();
		expect(charts.find((c) => c.id === 'power-output-trend')).toBeUndefined();
		expect(charts.find((c) => c.id === 'smoothness-trend')).toBeUndefined();
		expect(charts.find((c) => c.id === 'data-quality-trend')).toBeUndefined();
		expect(charts.find((c) => c.id === 'wheelie-pattern-analysis')).toBeUndefined();
	});

	it('includes a chart once at least one session supplies its optional field', () => {
		const points = [
			makePoint(1, { techniqueOverall: 70 }),
			makePoint(2, { techniqueOverall: null }), // null point is dropped, chart still included
			makePoint(3, { techniqueOverall: 85 })
		];
		const charts = buildProgressChartSeries(points);

		const technique = charts.find((c) => c.id === 'technique-quality-trend');
		expect(technique).toBeDefined();
		expect(technique?.data).toEqual([
			{ x: 1, y: 70, label: '2026-01-01' },
			{ x: 3, y: 85, label: '2026-01-03' }
		]);
	});

	it('returns an empty array for an empty session list', () => {
		expect(buildProgressChartSeries([])).toEqual([]);
	});
});

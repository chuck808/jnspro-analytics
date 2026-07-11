import type { PerformanceDiagnostic } from './diagnostics';
import type { SessionAnalysis, SeriesPoint } from './types';

export interface ChartSeriesBundle {
	acceleration: SeriesPoint[];
	speed: SeriesPoint[];
	distance: SeriesPoint[];
	impulse: SeriesPoint[];
	power: SeriesPoint[];
	jerk: SeriesPoint[];
}

export function buildChartSeries(analysis: SessionAnalysis): ChartSeriesBundle {
	const p = analysis.selectedRun?.physics;
	if (!p) return emptyChartSeries();

	return {
		acceleration: p.timesS.map((timeS, i) => ({ timeS, value: p.accelerationG[i] ?? 0 })),
		speed: p.timesS.map((timeS, i) => ({ timeS, value: p.speedKmh[i] ?? 0 })),
		distance: p.timesS.map((timeS, i) => ({ timeS, value: p.distanceM[i] ?? 0 })),
		impulse: p.impulseSeries ?? [],
		power: p.powerSeries ?? [],
		jerk: p.jerkSeries ?? []
	};
}

export function emptyChartSeries(): ChartSeriesBundle {
	return { acceleration: [], speed: [], distance: [], impulse: [], power: [], jerk: [] };
}

export function shouldShowPower(diagnostics: PerformanceDiagnostic[]): boolean {
	return !diagnostics.some(
		(d) => d.severity === 'error' && (d.area === 'speed' || d.area === 'power')
	);
}

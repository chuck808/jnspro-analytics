import { buildChartSeries, type DetailLevel, type SessionAnalysis } from '../performance-engine';
import type { CombinedRunAnalysis, ExistingAppAnalytics, IntegrationSection } from './types';

export interface CombineAnalysisOptions {
	detailLevel?: DetailLevel;
}

/**
 * Bridge object for the transition period.
 *
 * Rule:
 * - existing app analytics remain authoritative for acceleration splits and current phase UI
 * - performance engine remains authoritative for diagnostics, impulse, jerk/smoothness, layered messaging and future coaching logic
 */
export function combineRunAnalysis(
	engine: SessionAnalysis,
	app: ExistingAppAnalytics = {},
	options: CombineAnalysisOptions = {}
): CombinedRunAnalysis {
	const detailLevel = options.detailLevel ?? 'rider';
	const selectedRun = engine.selectedRun;
	const chartSeries = buildChartSeries(engine);

	const sections = buildIntegrationSections(engine, app, detailLevel);

	return {
		selectedRun,
		engine,
		app,
		sections,
		accelerationSplits: app.splits ?? [],
		chartSeries
	};
}

export function buildIntegrationSections(
	engine: SessionAnalysis,
	app: ExistingAppAnalytics,
	detailLevel: DetailLevel = 'rider'
): IntegrationSection[] {
	const sections: IntegrationSection[] = [
		{
			id: 'app-acceleration-splits',
			title: 'Acceleration splits',
			source: 'current-app',
			visibleFor: ['grom', 'rider', 'elite', 'coach'],
			status: app.splits?.length ? 'ready' : 'missing-data',
			summary: app.splits?.length
				? `Current app milestone logic found ${app.splits.length} speed targets.`
				: 'No acceleration split data is available for this run.'
		},
		{
			id: 'engine-layered-summary',
			title: 'Layered performance summary',
			source: 'performance-engine',
			visibleFor: ['grom', 'rider', 'elite', 'coach'],
			status: engine.selectedRun ? 'ready' : 'missing-data',
			summary: 'Performance Engine summary, recommendations and detail-level wording.'
		},
		{
			id: 'engine-impulse',
			title: 'Impulse diagnostics',
			source: 'performance-engine',
			visibleFor: ['elite', 'coach'],
			status: engine.selectedRun?.physics?.impulse ? 'ready' : 'missing-data',
			summary: engine.selectedRun?.physics?.impulse
				? `90% impulse reached at ${engine.selectedRun.physics.impulse.timeToNinetyPctImpulseS.toFixed(3)}s.`
				: 'Impulse requires chart data and rider/bike mass.'
		},
		{
			id: 'engine-jerk-smoothness',
			title: 'Smoothness / jerk',
			source: 'performance-engine',
			visibleFor: ['rider', 'elite', 'coach'],
			status: engine.selectedRun?.physics?.jerk ? 'ready' : 'missing-data',
			summary: engine.selectedRun?.physics?.jerk
				? `Smoothness score ${Math.round(engine.selectedRun.physics.jerk.smoothnessScore)}/100.`
				: 'Smoothness requires acceleration trace data.'
		},
		{
			id: 'engine-calibration-diagnostics',
			title: 'Calibration diagnostics',
			source: 'performance-engine',
			visibleFor: ['elite', 'coach'],
			status: engine.hasCalibrationWarning ? 'calibration-warning' : 'ready',
			summary: engine.hasCalibrationWarning
				? 'Some derived metrics should be hidden or treated as provisional.'
				: 'No blocking calibration warnings detected.'
		}
	];

	return sections.filter((section) => section.visibleFor.includes(detailLevel));
}

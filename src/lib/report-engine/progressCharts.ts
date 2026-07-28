import type { ReportChart } from './types';

/**
 * One row per session, chronologically ordered by the caller. Fields beyond
 * the core five are optional — omit a field entirely (not null) when the
 * caller genuinely has no way to compute it for that session context, and
 * buildProgressChartSeries will drop the corresponding chart rather than
 * emit an empty one.
 */
export interface ProgressChartSessionPoint {
	sessionId: string;
	sessionIndex: number; // 1-based, caller pre-sorts chronologically
	date: string; // ISO
	bestReactionTimeSec: number | null;
	avgReactionTimeSec: number | null;
	bestVsAvgGapPercent: number | null;
	optimalSetLength: number | null;
	dropOffRun: number | null;
	runCount: number;

	// technique-quality-trend / smoothness-trend / power-output-trend require
	// full analyseSession() output over chart_data — only available today from
	// the Analytics page (analytics/+page.server.ts's sessionAnalyses). The
	// session-detail page does not load chart_data for session history and
	// should not start to — that's an unbounded per-view cost for 3 charts
	// that already work correctly from the Analytics page. Omit these three
	// fields from session-detail-page callers rather than adding that load.
	techniqueOverall?: number | null;
	smoothness?: number | null;
	powerAverageW?: number | null;

	// data-quality-trend / wheelie-pattern-analysis need bias_correction_ms2 /
	// front_wheel_lifted per run — cheap extra columns, safe to add anywhere.
	dataQualityBias?: number | null;
	dataQualityValid?: boolean | null;
	wheelieRatePercent?: number | null;
}

interface ChartMeta {
	id: string;
	title: string;
	description: string;
	chartType: ReportChart['chartType'];
	dataKey: string;
	includeByDefault: boolean;
	metric: (s: ProgressChartSessionPoint) => number | null | undefined;
	label?: (s: ProgressChartSessionPoint) => string | undefined;
}

const CHART_METADATA: ChartMeta[] = [
	{
		id: 'reaction-time-trend',
		title: 'Reaction Time Trend',
		description: 'Average reaction time across sessions — lower is better.',
		chartType: 'line',
		dataKey: 'reactionTimeTrend',
		includeByDefault: true,
		metric: (s) => s.avgReactionTimeSec,
		label: (s) =>
			s.bestReactionTimeSec !== null ? `best ${s.bestReactionTimeSec.toFixed(3)}s` : undefined
	},
	{
		id: 'best-vs-average-gap-trend',
		title: 'Best vs Average Gap',
		description:
			'Shows whether peak performance is becoming more repeatable. Smaller gap = better consistency.',
		chartType: 'line',
		dataKey: 'bestVsAverageGapTrend',
		includeByDefault: true,
		metric: (s) => s.bestVsAvgGapPercent
	},
	{
		id: 'technique-quality-trend',
		title: 'Technique Consistency Over Time',
		description:
			'How repeatably you execute starts across sessions. Higher scores indicate more consistent technique.',
		chartType: 'line',
		dataKey: 'techniqueQualityTrend',
		includeByDefault: true,
		metric: (s) => s.techniqueOverall
	},
	{
		id: 'power-output-trend',
		title: 'Power Development',
		description:
			'Estimated peak power output showing strength progression. Calculated from G-force × body mass.',
		chartType: 'line',
		dataKey: 'powerOutputTrend',
		includeByDefault: true,
		metric: (s) => s.powerAverageW
	},
	{
		id: 'smoothness-trend',
		title: 'Force Application Smoothness',
		description: 'How cleanly power is applied through the start. Smoother = more efficient technique.',
		chartType: 'line',
		dataKey: 'smoothnessTrend',
		includeByDefault: true,
		metric: (s) => s.smoothness
	},
	{
		id: 'data-quality-trend',
		title: 'Sensor Data Quality',
		description: 'Calibration stability across sessions. Shows reliability of measurements.',
		chartType: 'bar',
		dataKey: 'dataQualityTrend',
		includeByDefault: false,
		metric: (s) => s.dataQualityBias,
		label: (s) =>
			s.dataQualityValid === undefined || s.dataQualityValid === null
				? undefined
				: s.dataQualityValid
					? 'valid'
					: 'invalid'
	},
	{
		id: 'wheelie-pattern-analysis',
		title: 'Wheelie Patterns & Impact',
		description: 'Wheelie frequency and correlation with reaction time performance.',
		chartType: 'bar',
		dataKey: 'wheeliePatternTrend',
		includeByDefault: false,
		metric: (s) => s.wheelieRatePercent
	},
	{
		id: 'optimal-set-length-trend',
		title: 'Optimal Set Length',
		description: 'How many quality runs per session before fatigue sets in.',
		chartType: 'bar',
		dataKey: 'optimalSetLengthTrend',
		includeByDefault: true,
		metric: (s) => s.optimalSetLength
	},
	{
		id: 'drop-off-position-trend',
		title: 'Drop-Off Position',
		description: 'Where performance deteriorates within a session — later is better.',
		chartType: 'line',
		dataKey: 'dropOffPositionTrend',
		includeByDefault: false,
		metric: (s) => s.dropOffRun
	}
];

/**
 * Maps per-session summary rows into report charts. A chart whose metric is
 * null/undefined for every session is omitted from the result entirely —
 * an absent chart is honest about what wasn't computed; a present-but-empty
 * one just repeats the "No data available" placeholder for a different
 * reason (see ReportChart.svelte's empty-state branch).
 */
export function buildProgressChartSeries(sessions: ProgressChartSessionPoint[]): ReportChart[] {
	const charts: ReportChart[] = [];

	for (const meta of CHART_METADATA) {
		const data = sessions
			.map((s) => {
				const y = meta.metric(s);
				if (typeof y !== 'number' || !Number.isFinite(y)) return null;
				return { x: s.sessionIndex, y, label: meta.label?.(s) ?? s.date };
			})
			.filter((point): point is { x: number; y: number; label: string } => point !== null);

		if (data.length === 0) continue;

		charts.push({
			id: meta.id,
			title: meta.title,
			description: meta.description,
			chartType: meta.chartType,
			dataKey: meta.dataKey,
			includeByDefault: meta.includeByDefault,
			data
		});
	}

	return charts;
}

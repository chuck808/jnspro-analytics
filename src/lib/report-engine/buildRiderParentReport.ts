import type {
	CoachSessionReportInput,
	GeneratedReport,
	ProgressReportInput,
	ReportBuildOptions,
	ReportRecommendation,
	RiderParentReportInput
} from './types';
import { compactLines, createRecommendation, reportId, createSection } from './reportSections';
import {
	isCoach,
	progressExecutiveSummary,
	sessionExecutiveSummary,
	sessionQualityHeadline,
	techniqueSection,
	trendSentence,
	watchForSection,
	type TechniqueInput
} from './reportLanguage';

/**
 * Plain-language summary for a rider or parent — always 'simple' detail
 * regardless of what the caller asks for. Thin composition over the
 * existing single-session and progress data, not a parallel report engine.
 * Accepts either shape a caller already has assembled (session-page callers
 * pass 'session', analytics-page callers pass 'progress').
 */
export function buildRiderParentReport(
	input: RiderParentReportInput,
	options: ReportBuildOptions = {}
): GeneratedReport {
	const includeRecs = options.includeRecommendations ?? true;

	return input.kind === 'session'
		? buildFromSession(input.session, includeRecs)
		: buildFromProgress(input.progress, includeRecs);
}

function buildFromSession(session: CoachSessionReportInput, includeRecs: boolean): GeneratedReport {
	const level = 'simple' as const;
	const sessionReport = session.sessionReport;
	const technique = session.techniqueSummary;

	const headline = sessionQualityHeadline({
		sessionQuality: sessionReport?.sessionQuality ?? null,
		repeatability: sessionReport?.repeatability?.overall ?? null,
		bestVsAvgGap: sessionReport?.bestVsAvg?.gapPercent ?? null,
		optimalSetLength: sessionReport?.setLength?.optimal ?? null,
		dropOffRun: sessionReport?.dropOff?.dropOffRun ?? null,
		runCount: session.runCount
	});

	const summaryLines = sessionExecutiveSummary({
		headline,
		qualityScore: sessionReport?.sessionQuality ?? null,
		bestVsAvgGap: sessionReport?.bestVsAvg?.gapPercent ?? null,
		dropOffRun: sessionReport?.dropOff?.dropOffRun ?? null,
		runCount: session.runCount,
		dataQualityLabel: session.dataQuality?.label ?? null,
		level
	});

	const techniqueInput: TechniqueInput = {
		overall: technique?.overall ?? null,
		reaction: technique?.reaction ?? null,
		explosiveness: technique?.explosiveness ?? null,
		smoothness: technique?.smoothness ?? null,
		efficiency: technique?.efficiency ?? null,
		riderLevel: session.riderLevel ?? null
	};
	const techniqueLines = techniqueSection(techniqueInput, level);

	const watchLines = watchForSection(
		compactLines([
			session.sessionReport?.dropOff?.dropOffRun !== null &&
			session.sessionReport?.dropOff?.dropOffRun !== undefined
				? `Whether performance holds up longer next session before dropping off.`
				: null
		]),
		level
	);

	const recommendations: ReportRecommendation[] = includeRecs
		? buildSimpleRecommendations(session.recommendations)
		: [];

	const sections = [
		createSection({
			id: 'executive-summary',
			type: 'executive-summary',
			title: 'Summary',
			priority: 'high',
			content: summaryLines
		}),
		createSection({
			id: 'technique-analysis',
			type: 'technique-analysis',
			title: 'Technique',
			priority: 'medium',
			content: techniqueLines
		}),
		watchLines.length > 0
			? createSection({
					id: 'watch-for',
					type: 'watch-for',
					title: 'Next Session',
					priority: 'medium',
					content: watchLines
				})
			: null
	].filter((s): s is NonNullable<typeof s> => s !== null);

	return {
		id: reportId('rider-parent-report'),
		type: 'rider-parent',
		title: 'Session Summary',
		subtitle: session.sessionTitle ?? session.sessionDate,
		generatedAt: new Date().toISOString(),
		detailLevel: level,
		subject: {
			riderName: session.riderName,
			sessionId: session.sessionId,
			sessionTitle: session.sessionTitle,
			sessionCount: 1
		},
		summary: {
			headline,
			body: compactLines([summaryLines[1] ?? null])
		},
		sections,
		charts: [],
		recommendations
	};
}

function buildFromProgress(progress: ProgressReportInput, includeRecs: boolean): GeneratedReport {
	const level = 'simple' as const;
	const report = progress.crossSessionReport;
	const confidence = (report?.confidence ?? 'low') as 'low' | 'medium' | 'high';
	const headline = report?.headline ?? `Progress report across ${progress.sessionCount} sessions.`;

	const summaryLines = progressExecutiveSummary({
		headline,
		overallTrend: report?.overallTrend ?? 'unknown',
		confidence,
		sessionCount: progress.sessionCount,
		warnings: report?.warnings ?? [],
		level
	});

	const trendLines = compactLines([
		// Reaction time: lower is better, so a negative change is improving.
		reactionTrendSentence(report?.performance?.reactionTrend, confidence, level),
		// Peak speed: higher is better, so a positive change is improving.
		speedTrendSentence(report?.performance?.speedTrend, confidence, level)
	]);

	const watchLines = watchForSection(
		(report?.warnings ?? []).filter((w) => w && w.trim().length > 20).slice(0, 2),
		level
	);

	const recommendations: ReportRecommendation[] = includeRecs
		? buildSimpleRecommendations(progress.recommendations ?? report?.recommendations)
		: [];

	const sections = [
		createSection({
			id: 'executive-summary',
			type: 'executive-summary',
			title: 'Summary',
			priority: 'high',
			content: summaryLines
		}),
		trendLines.length > 0
			? createSection({
					id: 'progress-trends',
					type: 'progress-trends',
					title: 'How Things Are Going',
					priority: 'high',
					content: trendLines
				})
			: null,
		watchLines.length > 0
			? createSection({
					id: 'watch-for',
					type: 'watch-for',
					title: 'Next Sessions',
					priority: 'medium',
					content: watchLines
				})
			: null
	].filter((s): s is NonNullable<typeof s> => s !== null);

	return {
		id: reportId('rider-parent-report'),
		type: 'rider-parent',
		title: 'Progress Summary',
		subtitle: progress.dateRange,
		generatedAt: new Date().toISOString(),
		detailLevel: level,
		subject: {
			riderName: progress.riderName,
			dateRange: progress.dateRange,
			sessionCount: progress.sessionCount
		},
		summary: {
			headline,
			body: compactLines([summaryLines[1] ?? null])
		},
		sections,
		charts: [],
		recommendations
	};
}

interface SimpleTrend {
	change: number | null;
}

// Reaction time: lower is better, so a negative change is improving.
function reactionTrendSentence(
	trend: SimpleTrend | undefined,
	confidence: 'low' | 'medium' | 'high',
	level: 'simple'
): string | null {
	if (!trend || trend.change === null || trend.change === undefined) return null;
	const direction = trend.change < 0 ? 'improving' : trend.change > 0 ? 'declining' : 'stable';
	return trendSentence({ metric: 'Reaction time', direction, change: trend.change, unit: 's', confidence }, level);
}

// Peak speed: higher is better, so a positive change is improving.
function speedTrendSentence(
	trend: SimpleTrend | undefined,
	confidence: 'low' | 'medium' | 'high',
	level: 'simple'
): string | null {
	if (!trend || trend.change === null || trend.change === undefined) return null;
	const direction = trend.change > 0 ? 'improving' : trend.change < 0 ? 'declining' : 'stable';
	return trendSentence({ metric: 'Peak speed', direction, change: trend.change, unit: 'km/h', confidence }, level);
}

function buildSimpleRecommendations(
	raw: ReportRecommendation[] | string[] | undefined
): ReportRecommendation[] {
	if (!raw || raw.length === 0) return [];
	return raw.slice(0, 2).map((rec, i) => {
		if (typeof rec === 'string') {
			return createRecommendation({ id: `rider-parent-rec-${i + 1}`, priority: 'medium', title: `Focus ${i + 1}`, body: rec });
		}
		return rec;
	});
}

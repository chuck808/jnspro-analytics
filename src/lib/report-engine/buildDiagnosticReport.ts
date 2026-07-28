import type { CoachSessionReportInput, GeneratedReport, ReportBuildOptions } from './types';
import { compactLines, createSection, reportId } from './reportSections';
import { dataQualitySection, confidenceStatement, type DataQualityInput } from './reportLanguage';

/**
 * "Can this session's data actually be trusted?" — a data-trust document,
 * not a trend document. Reuses CoachSessionReportInput as-is; every field
 * it needs (dataQuality, sessionReport.runSummaries, excludedReasons) is
 * already assembled by callers building a Session Report.
 */
export function buildDiagnosticReport(
	input: CoachSessionReportInput,
	options: ReportBuildOptions = {}
): GeneratedReport {
	const detailLevel = options.detailLevel ?? 'technical';
	const dataQuality = input.dataQuality;
	const narrative = input.sessionNarrative;

	const dqInput: DataQualityInput = {
		label: dataQuality?.label ?? null,
		biasCorrection: dataQuality?.biasCorrection ?? null,
		analyticsValid: dataQuality?.analyticsValid ?? true,
		blocksPower: dataQuality?.blocksPower ?? false,
		blocksSpeed: dataQuality?.blocksSpeed ?? dataQuality?.blocksDistanceConfidence ?? false
	};

	const trustworthy = dqInput.analyticsValid && !dqInput.blocksPower && !dqInput.blocksSpeed;
	const headline = trustworthy
		? 'Data quality is good — the numbers in this session can be trusted.'
		: 'Some figures in this session carry caveats — read the notes below before acting on them.';

	const confidence = narrative?.trust?.confidence ?? input.sessionReport?.confidence ?? undefined;
	const confidenceLevel = isTrustLevel(confidence) ? confidence : null;

	// ── 1. Executive summary ───────────────────────────────────────────────────
	const execLines = compactLines([
		headline,
		...dataQualitySection(dqInput, detailLevel),
		confidenceLevel ? confidenceStatement(confidenceLevel, 1, detailLevel) : null
	]);

	const executiveSummarySection = createSection({
		id: 'executive-summary',
		type: 'executive-summary',
		title: 'Summary',
		priority: 'high',
		content: execLines
	});

	// ── 2. Per-run breakdown ───────────────────────────────────────────────────
	const runLines = buildRunBreakdown(input);
	const runBreakdownSection =
		runLines.length > 0
			? createSection({
					id: 'run-breakdown',
					type: 'session-quality',
					title: 'Per-Run Data Quality',
					priority: 'high',
					content: runLines
				})
			: null;

	// ── 3. Excluded runs ───────────────────────────────────────────────────────
	const excludedRuns = input.excludedRunCount ?? narrative?.trust?.excludedRuns ?? 0;
	const excludedReasons = input.excludedReasons ?? narrative?.trust?.excludedReasons ?? [];
	const excludedLines =
		excludedRuns > 0
			? [
					`${excludedRuns} of ${input.runCount + excludedRuns} runs excluded from analysis${
						excludedReasons.length > 0 ? ` (${[...new Set(excludedReasons)].join(', ')})` : ''
					}.`
				]
			: [];
	const excludedSection =
		excludedLines.length > 0
			? createSection({
					id: 'excluded-runs',
					type: 'data-quality',
					title: 'Excluded Runs',
					priority: 'medium',
					content: excludedLines
				})
			: null;

	// ── 4. Full calibration detail ─────────────────────────────────────────────
	const calibrationSection = createSection({
		id: 'calibration-detail',
		type: 'data-quality',
		title: 'Calibration Detail',
		priority: 'medium',
		content: dataQualitySection(dqInput, 'technical')
	});

	const sections = [executiveSummarySection, runBreakdownSection, excludedSection, calibrationSection].filter(
		(s): s is NonNullable<typeof s> => s !== null
	);

	return {
		id: reportId('diagnostic-report'),
		type: 'diagnostic',
		title: 'Diagnostic Report',
		subtitle: input.sessionTitle ?? input.sessionDate,
		generatedAt: new Date().toISOString(),
		detailLevel,
		subject: {
			riderName: input.riderName,
			sessionId: input.sessionId,
			sessionTitle: input.sessionTitle,
			sessionCount: 1
		},
		summary: {
			headline,
			body: compactLines([excludedLines[0] ?? null])
		},
		sections,
		charts: [],
		recommendations: []
	};
}

function isTrustLevel(value: unknown): value is 'low' | 'medium' | 'high' {
	return value === 'low' || value === 'medium' || value === 'high';
}

function buildRunBreakdown(input: CoachSessionReportInput): string[] {
	const runs = input.sessionReport?.runSummaries;
	if (!runs || runs.length === 0) return [];

	return runs.map((r) => {
		const reaction = r.reactionMs !== null ? `reaction ${(r.reactionMs / 1000).toFixed(3)}s` : 'reaction —';
		const g = r.maxG !== null ? `${r.maxG.toFixed(2)}g` : '—g';
		const validity = r.analyticsValid ? 'analytics valid' : 'analytics INVALID';
		return `Run ${r.runNumber}: ${reaction} · ${g} · ${validity}`;
	});
}

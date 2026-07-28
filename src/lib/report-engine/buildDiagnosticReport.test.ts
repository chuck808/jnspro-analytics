import { describe, expect, it } from 'vitest';
import { buildDiagnosticReport } from './buildDiagnosticReport';
import type { CoachSessionReportInput } from './types';

function makeInput(overrides: Partial<CoachSessionReportInput> = {}): CoachSessionReportInput {
	return {
		sessionId: 'session-1',
		runCount: 5,
		...overrides
	};
}

describe('buildDiagnosticReport', () => {
	it('defaults to the technical detail level', () => {
		const report = buildDiagnosticReport(makeInput());
		expect(report.detailLevel).toBe('technical');
		expect(report.type).toBe('diagnostic');
	});

	it('honors an explicit detail level override', () => {
		const report = buildDiagnosticReport(makeInput(), { detailLevel: 'standard' });
		expect(report.detailLevel).toBe('standard');
	});

	it('gives a trustworthy headline when data quality is clean', () => {
		const report = buildDiagnosticReport(
			makeInput({
				dataQuality: {
					label: 'Excellent',
					biasCorrection: 0.2,
					analyticsValid: true,
					blocksPower: false,
					blocksSpeed: false
				}
			})
		);
		expect(report.summary.headline).toContain('can be trusted');
	});

	it('flags caveats in the headline when data quality is compromised', () => {
		const report = buildDiagnosticReport(
			makeInput({
				dataQuality: {
					label: 'Poor',
					biasCorrection: 3.5,
					analyticsValid: false,
					blocksPower: true,
					blocksSpeed: true
				}
			})
		);
		expect(report.summary.headline).toContain('caveats');
	});

	it('includes an excluded-runs section only when runs were excluded', () => {
		const withExclusions = buildDiagnosticReport(
			makeInput({ excludedRunCount: 2, excludedReasons: ['Warmup'] })
		);
		const withoutExclusions = buildDiagnosticReport(makeInput());

		expect(withExclusions.sections.find((s) => s.id === 'excluded-runs')).toBeDefined();
		expect(withoutExclusions.sections.find((s) => s.id === 'excluded-runs')).toBeUndefined();
	});

	it('lists a per-run breakdown when runSummaries are provided', () => {
		const report = buildDiagnosticReport(
			makeInput({
				sessionReport: {
					sessionQuality: 70,
					runSummaries: [
						{
							runNumber: 1,
							reactionMs: 180,
							maxG: 1.1,
							peakSpeedKmh: 22,
							techniqueOverall: 70,
							analyticsValid: true
						},
						{
							runNumber: 2,
							reactionMs: null,
							maxG: null,
							peakSpeedKmh: null,
							techniqueOverall: null,
							analyticsValid: false
						}
					]
				}
			})
		);

		const breakdown = report.sections.find((s) => s.id === 'run-breakdown');
		expect(breakdown).toBeDefined();
		expect(breakdown!.content[0]).toContain('Run 1');
		expect(breakdown!.content[0]).toContain('analytics valid');
		expect(breakdown!.content[1]).toContain('analytics INVALID');
	});
});

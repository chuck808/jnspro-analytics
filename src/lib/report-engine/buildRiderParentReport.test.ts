import { describe, expect, it } from 'vitest';
import { buildRiderParentReport } from './buildRiderParentReport';
import type { CoachSessionReportInput, ProgressReportInput } from './types';

function makeSessionInput(overrides: Partial<CoachSessionReportInput> = {}): CoachSessionReportInput {
	return {
		sessionId: 'session-1',
		runCount: 8,
		sessionReport: {
			sessionQuality: 72,
			repeatability: { overall: 70, cvPercent: 6, label: 'Good' },
			bestVsAvg: { gapPercent: 6 },
			setLength: { optimal: 6 },
			dropOff: { dropOffRun: 6 }
		},
		...overrides
	};
}

function makeProgressInput(overrides: Partial<ProgressReportInput> = {}): ProgressReportInput {
	return {
		sessionCount: 6,
		...overrides
	};
}

describe('buildRiderParentReport', () => {
	it('always forces the simple detail level, even if a caller asks for something else', () => {
		const session = buildRiderParentReport(
			{ kind: 'session', session: makeSessionInput() },
			{ detailLevel: 'technical' }
		);
		const progress = buildRiderParentReport(
			{ kind: 'progress', progress: makeProgressInput() },
			{ detailLevel: 'coach' }
		);

		expect(session.detailLevel).toBe('simple');
		expect(progress.detailLevel).toBe('simple');
	});

	it('tags both branches with the rider-parent report type', () => {
		const session = buildRiderParentReport({ kind: 'session', session: makeSessionInput() });
		const progress = buildRiderParentReport({ kind: 'progress', progress: makeProgressInput() });

		expect(session.type).toBe('rider-parent');
		expect(progress.type).toBe('rider-parent');
	});

	it('builds a session-shaped summary for kind: session', () => {
		const report = buildRiderParentReport({ kind: 'session', session: makeSessionInput() });

		expect(report.subject.sessionId).toBe('session-1');
		expect(report.subject.sessionCount).toBe(1);
		expect(report.sections.find((s) => s.id === 'technique-analysis')).toBeDefined();
	});

	it('builds a progress-shaped summary for kind: progress', () => {
		const report = buildRiderParentReport({ kind: 'progress', progress: makeProgressInput() });

		expect(report.subject.sessionCount).toBe(6);
		expect(report.subject.sessionId).toBeUndefined();
		expect(report.sections.find((s) => s.id === 'technique-analysis')).toBeUndefined();
	});

	it('has no technical sections (no metrics table, no appendix)', () => {
		const report = buildRiderParentReport({ kind: 'session', session: makeSessionInput() });
		expect(report.appendices).toBeUndefined();
		expect(report.sections.find((s) => s.id === 'data-quality')).toBeUndefined();
	});
});

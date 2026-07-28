import { describe, expect, it } from 'vitest';
import { buildCoachSessionReport } from './buildSessionReport';
import type { CoachSessionReportInput } from './types';

function makeInput(overrides: Partial<CoachSessionReportInput> = {}): CoachSessionReportInput {
	return {
		sessionId: 'session-1',
		runCount: 8,
		sessionReport: {
			sessionQuality: 72,
			repeatability: { overall: 70, cvPercent: 6, label: 'Good' },
			bestVsAvg: { gapPercent: 6 },
			setLength: { optimal: 6 },
			dropOff: { dropOffRun: 6 },
			runSummaries: []
		},
		...overrides
	};
}

function findSection(report: ReturnType<typeof buildCoachSessionReport>, id: string) {
	return report.sections.find((s) => s.id === id);
}

describe('buildCoachSessionReport', () => {
	it('uses the narrative headline when it carries the coaching flag', () => {
		const input = makeInput({
			sessionNarrative: {
				message: {
					headline: 'Custom coaching headline for this run',
					isCoachingHeadline: true
				}
			}
		});

		const report = buildCoachSessionReport(input);
		expect(report.summary.headline).toBe('Custom coaching headline for this run');
	});

	it('falls back to the generated quality headline without the coaching flag', () => {
		const withoutNarrative = buildCoachSessionReport(makeInput());
		const withUnflagged = buildCoachSessionReport(
			makeInput({
				sessionNarrative: { message: { headline: 'Some ad-hoc headline' } }
			})
		);

		// Both should use the generated sessionQualityHeadline, not the ad-hoc one.
		expect(withoutNarrative.summary.headline).toBe(withUnflagged.summary.headline);
		expect(withUnflagged.summary.headline).not.toBe('Some ad-hoc headline');
	});

	it('frames competition-excluded runs only when Competition is in excludedReasons', () => {
		const withCompetition = buildCoachSessionReport(
			makeInput({ excludedRunCount: 1, excludedReasons: ['Competition'] })
		);
		const withoutExclusions = buildCoachSessionReport(makeInput());

		const summaryWith = findSection(withCompetition, 'executive-summary')!.content.join(' ');
		const summaryWithout = findSection(withoutExclusions, 'executive-summary')!.content.join(' ');

		expect(summaryWith).toContain('Competition runs were excluded');
		expect(summaryWithout).not.toContain('Competition runs were excluded');
	});

	it('frames best-effort-excluded runs only when Best Effort is in excludedReasons', () => {
		const report = buildCoachSessionReport(
			makeInput({ excludedRunCount: 1, excludedReasons: ['Best Effort'] })
		);
		const summary = findSection(report, 'executive-summary')!.content.join(' ');

		expect(summary).toContain('Best-effort runs were excluded');
	});

	it('groups the coaching log by note type in pre → during → post → coach order', () => {
		const report = buildCoachSessionReport(
			makeInput({
				sessionNotes: [
					{ note_type: 'coach', content: 'Watch the second pedal stroke', author_role: 'coach' },
					{ note_type: 'pre', content: 'Feeling fresh today', author_role: 'rider' },
					{ note_type: 'post', content: 'Legs were tired by run 6', author_role: 'rider' },
					{ note_type: 'during', content: 'Wind picked up after run 4', author_role: 'parent' }
				]
			})
		);

		const log = findSection(report, 'coaching-log');
		expect(log).toBeDefined();

		const content = log!.content;
		const preIdx = content.indexOf('Pre-session:');
		const duringIdx = content.indexOf('During session:');
		const postIdx = content.indexOf('Post-session:');
		const coachIdx = content.indexOf('Coach feedback:');

		expect(preIdx).toBeGreaterThanOrEqual(0);
		expect(preIdx).toBeLessThan(duringIdx);
		expect(duringIdx).toBeLessThan(postIdx);
		expect(postIdx).toBeLessThan(coachIdx);
		expect(content).toContain('[Rider] Feeling fresh today');
		expect(content).toContain('[Coach] Watch the second pedal stroke');
	});

	it('omits the coaching-log section entirely when there are no session notes', () => {
		const report = buildCoachSessionReport(makeInput());
		expect(findSection(report, 'coaching-log')).toBeUndefined();
	});
});

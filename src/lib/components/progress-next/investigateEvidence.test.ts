import { describe, expect, it } from 'vitest';
import { buildInvestigateEvidence } from './investigateEvidence';

function session(
	id: string,
	timestamp: string,
	diagnostics: Array<{
		title: string;
		tone: 'positive' | 'warning' | 'neutral';
		summary?: string;
		evidence?: string[];
		prescription?: string[];
		audience?: 'grom' | 'rider' | 'elite' | 'coach';
	}> = []
) {
	return {
		sessionId: id,
		timestamp,
		diagnostics: diagnostics.map((d) => ({
			summary: '',
			evidence: [] as string[],
			prescription: [] as string[],
			audience: 'rider' as const,
			...d
		}))
	};
}

describe('buildInvestigateEvidence', () => {
	it('keeps absent evidence unavailable', () => {
		expect(buildInvestigateEvidence([])).toMatchObject({
			state: 'absent',
			supportedAnalysisCount: 0,
			signals: []
		});
	});

	it('does not display a one-off diagnostic as a recurring signal', () => {
		const evidence = buildInvestigateEvidence([
			session('s1', '2026-01-01T00:00:00Z', [
				{ title: 'Force application is choppy', tone: 'warning' }
			])
		]);

		expect(evidence.state).toBe('observed');
		expect(evidence.signals).toEqual([]);
	});

	it('counts recurrence once per supported session even if a title is duplicated within one session', () => {
		const evidence = buildInvestigateEvidence([
			session('s1', '2026-01-01T00:00:00Z', [
				{ title: 'Balanced run profile', tone: 'neutral' },
				{ title: 'Balanced run profile', tone: 'neutral' }
			]),
			session('s2', '2026-01-02T00:00:00Z', [
				{ title: 'Balanced run profile', tone: 'neutral' }
			])
		]);

		expect(evidence.signals[0]?.occurrenceCount).toBe(2);
	});

	it('keeps tone and provenance from the latest occurrence instead of escalating an older warning', () => {
		const evidence = buildInvestigateEvidence([
			session('s1', '2026-01-01T00:00:00Z', [
				{ title: 'Shared diagnostic', tone: 'warning' }
			]),
			session('s2', '2026-01-03T00:00:00Z', [
				{ title: 'Shared diagnostic', tone: 'neutral' }
			]),
			session('s3', '2026-01-02T00:00:00Z', [
				{ title: 'Shared diagnostic', tone: 'positive' }
			])
		]);

		expect(evidence.signals[0]).toMatchObject({
			title: 'Shared diagnostic',
			occurrenceCount: 3,
			latestTimestamp: '2026-01-03T00:00:00Z',
			latestSessionId: 's2',
			latestTone: 'neutral'
		});
	});

	it('carries summary, evidence, prescription, and audience from the latest occurrence instead of an older occurrence\'s', () => {
		const evidence = buildInvestigateEvidence([
			session('s1', '2026-01-01T00:00:00Z', [
				{
					title: 'Shared diagnostic',
					tone: 'warning',
					summary: 'Oldest summary',
					evidence: ['Oldest evidence'],
					prescription: ['Oldest prescription'],
					audience: 'coach'
				}
			]),
			session('s2', '2026-01-03T00:00:00Z', [
				{
					title: 'Shared diagnostic',
					tone: 'neutral',
					summary: 'Latest summary',
					evidence: ['Latest evidence line 1', 'Latest evidence line 2'],
					prescription: ['Latest prescription step'],
					audience: 'rider'
				}
			]),
			session('s3', '2026-01-02T00:00:00Z', [
				{
					title: 'Shared diagnostic',
					tone: 'positive',
					summary: 'Middle summary',
					evidence: ['Middle evidence'],
					prescription: ['Middle prescription'],
					audience: 'elite'
				}
			])
		]);

		expect(evidence.signals[0]).toMatchObject({
			latestSessionId: 's2',
			latestSummary: 'Latest summary',
			latestEvidence: ['Latest evidence line 1', 'Latest evidence line 2'],
			latestPrescription: ['Latest prescription step'],
			latestAudience: 'rider'
		});
	});

	it('does not let a one-off diagnostic\'s rich text leak into signals', () => {
		const evidence = buildInvestigateEvidence([
			session('s1', '2026-01-01T00:00:00Z', [
				{
					title: 'Force application is choppy',
					tone: 'warning',
					summary: 'A rich, specific summary.',
					evidence: ['Smoothness 41/100'],
					prescription: ['Check device mounting first.']
				}
			])
		]);

		expect(evidence.state).toBe('observed');
		expect(evidence.signals).toEqual([]);
	});

	it('keeps distinct latest audiences independent across two different repeated signals', () => {
		const evidence = buildInvestigateEvidence([
			session('s1', '2026-01-01T00:00:00Z', [
				{ title: 'Coach signal', tone: 'warning', audience: 'coach' },
				{ title: 'Rider signal', tone: 'neutral', audience: 'rider' }
			]),
			session('s2', '2026-01-02T00:00:00Z', [
				{ title: 'Coach signal', tone: 'warning', audience: 'coach' },
				{ title: 'Rider signal', tone: 'neutral', audience: 'rider' }
			])
		]);

		const coachSignal = evidence.signals.find((signal) => signal.title === 'Coach signal');
		const riderSignal = evidence.signals.find((signal) => signal.title === 'Rider signal');
		expect(coachSignal?.latestAudience).toBe('coach');
		expect(riderSignal?.latestAudience).toBe('rider');
	});
});

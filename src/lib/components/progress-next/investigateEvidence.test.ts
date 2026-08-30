import { describe, expect, it } from 'vitest';
import { buildInvestigateEvidence } from './investigateEvidence';

function session(
	id: string,
	timestamp: string,
	diagnostics: Array<{ title: string; tone: 'positive' | 'warning' | 'neutral' }> = []
) {
	return { sessionId: id, timestamp, diagnostics };
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
});

import { describe, expect, it } from 'vitest';
import { buildStrengthsLimitersEvidence } from './strengthsLimitersEvidence';

function session(
	id: string,
	timestamp: string,
	strengths: string[] = [],
	limiters: string[] = []
) {
	return { sessionId: id, timestamp, insightPack: { strengths, limiters } };
}

describe('buildStrengthsLimitersEvidence', () => {
	it('keeps absent evidence unavailable', () => {
		expect(buildStrengthsLimitersEvidence([])).toMatchObject({
			state: 'absent',
			supportedAnalysisCount: 0,
			strengths: [],
			limiters: []
		});
	});

	it('does not promote a one-off engine label into a recurring theme', () => {
		const evidence = buildStrengthsLimitersEvidence([
			session('s1', '2026-01-01T00:00:00Z', ['Speed carry'], ['Repeatability'])
		]);

		expect(evidence.state).toBe('observed');
		expect(evidence.strengths).toEqual([]);
		expect(evidence.limiters).toEqual([]);
	});

	it('counts recurrence by supported session rather than duplicate labels within one session', () => {
		const evidence = buildStrengthsLimitersEvidence([
			session('s1', '2026-01-01T00:00:00Z', ['Speed carry', 'Speed carry']),
			session('s2', '2026-01-02T00:00:00Z', ['Speed carry'])
		]);

		expect(evidence.strengths).toEqual([
			{
				name: 'Speed carry',
				occurrenceCount: 2,
				supportedAnalysisCount: 2,
				latestTimestamp: '2026-01-02T00:00:00Z',
				latestSessionId: 's2'
			}
		]);
	});

	it('ranks repeated themes by recurrence without inventing earlier-versus-recent direction', () => {
		const evidence = buildStrengthsLimitersEvidence([
			session('s1', '2026-01-01T00:00:00Z', ['Launch reaction', 'Speed carry'], ['Repeatability']),
			session('s2', '2026-01-02T00:00:00Z', ['Speed carry'], ['Repeatability']),
			session('s3', '2026-01-03T00:00:00Z', ['Launch reaction', 'Speed carry'], ['Gate reaction'])
		]);

		expect(evidence.state).toBe('repeated');
		expect(evidence.strengths.map((item) => [item.name, item.occurrenceCount])).toEqual([
			['Speed carry', 3],
			['Launch reaction', 2]
		]);
		expect(evidence.limiters.map((item) => [item.name, item.occurrenceCount])).toEqual([
			['Repeatability', 2]
		]);
	});
});

import { describe, expect, it } from 'vitest';
import { buildPowerPeakEvidence } from './powerPeakEvidence';
import type { PowerSessionAnalysisLike } from './powerEvidence';

function session(index: number, peakW: number | null, valid = true): PowerSessionAnalysisLike {
	return {
		sessionId: `session-${index}`,
		timestamp: `2026-08-${String(index).padStart(2, '0')}T10:00:00.000Z`,
		analysis: {
			selectedRun:
				peakW === null
					? { analyticsValid: valid, physics: null }
					: { analyticsValid: valid, physics: { power: { peakW, averageW: peakW / 1.5, estimated: true } } }
		}
	};
}

describe('buildPowerPeakEvidence', () => {
	it('treats one measured peak-power session as a fact, not history', () => {
		const result = buildPowerPeakEvidence([session(1, 950)]);

		expect(result.state).toBe('measured');
		expect(result.supportedSessionCount).toBe(1);
		expect(result.latestPeakW).toBe(950);
		expect(result.finding).toBeNull();
	});

	it('does not treat a session without physics as peak-power evidence', () => {
		const result = buildPowerPeakEvidence([session(1, null)]);

		expect(result.state).toBe('measured');
		expect(result.supportedSessionCount).toBe(0);
		expect(result.latestPeakW).toBeNull();
	});

	it('does not gate an analytics-invalid run into supported evidence', () => {
		const result = buildPowerPeakEvidence([session(1, 950, false)]);

		expect(result.supportedSessionCount).toBe(0);
	});

	it('uses two supported sessions as observed history with no trend claim', () => {
		const result = buildPowerPeakEvidence([session(1, 900), session(2, 930)]);

		expect(result.state).toBe('observed-history');
		expect(result.finding).toBeNull();
		expect(result.presentation.statement).toContain('No peak-power trend claim yet');
	});

	it('uses three to four supported sessions as early-signal territory', () => {
		const result = buildPowerPeakEvidence([session(1, 900), session(2, 920), session(3, 940), session(4, 960)]);

		expect(result.state).toBe('early-signal');
		expect(result.finding?.direction).toBe('improving');
		expect(result.presentation.label).toBe('Early signal');
		expect(result.presentation.statement).toContain('appears');
	});

	it('uses five supported sessions as supported-finding territory', () => {
		const result = buildPowerPeakEvidence([
			session(1, 900),
			session(2, 920),
			session(3, 940),
			session(4, 960),
			session(5, 980)
		]);

		expect(result.state).toBe('supported-finding');
		expect(result.finding?.direction).toBe('improving');
		expect(result.presentation.statement).not.toContain('appears');
	});

	it('keeps missing-peak sessions out of supported coverage', () => {
		const result = buildPowerPeakEvidence([
			session(1, 900),
			session(2, null),
			session(3, 940),
			session(4, null),
			session(5, 980)
		]);

		expect(result.totalSessionCount).toBe(5);
		expect(result.supportedSessionCount).toBe(3);
		expect(result.history.map((point) => point.sessionId)).toEqual(['session-1', 'session-3', 'session-5']);
		expect(result.state).toBe('early-signal');
	});

	it('uses cautious wording for an early declining signal', () => {
		const result = buildPowerPeakEvidence([session(1, 1000), session(2, 970), session(3, 940), session(4, 910)]);

		expect(result.finding?.direction).toBe('declining');
		expect(result.presentation.statement).toContain('appears');
		expect(result.presentation.statement).toContain('lower than');
	});
});

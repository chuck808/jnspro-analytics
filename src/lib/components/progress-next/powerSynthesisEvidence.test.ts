import { describe, expect, it } from 'vitest';
import { buildPowerEvidence } from './powerEvidence';
import { buildPowerPeakEvidence } from './powerPeakEvidence';
import { buildPowerSynthesisEvidence } from './powerSynthesisEvidence';
import type { PowerSessionAnalysisLike } from './powerEvidence';

function session(index: number, avg: number, peak: number | null): PowerSessionAnalysisLike {
	return {
		sessionId: `session-${index}`,
		timestamp: `2026-08-${String(index).padStart(2, '0')}T10:00:00.000Z`,
		analysis: {
			selectedRun: {
				analyticsValid: true,
				physics: { power: { averageW: avg, peakW: peak === null ? NaN : peak, estimated: true } }
			}
		}
	};
}

describe('buildPowerSynthesisEvidence', () => {
	it('stays building until both directional findings exist', () => {
		const sessions = [session(1, 500, 900), session(2, 510, 910)];
		const result = buildPowerSynthesisEvidence(buildPowerEvidence(sessions), buildPowerPeakEvidence(sessions));

		expect(result.state).toBe('building');
		expect(result.statement).toContain('shown separately');
	});

	it('caps synthesis at early while preserving each claim confidence posture', () => {
		const sessions = [
			session(1, 480, null),
			session(2, 490, null),
			session(3, 500, 900),
			session(4, 510, 920),
			session(5, 520, 940)
		];
		const result = buildPowerSynthesisEvidence(buildPowerEvidence(sessions), buildPowerPeakEvidence(sessions));

		expect(result.state).toBe('early-synthesis');
		expect(result.statement).toContain('average power is rising');
		expect(result.statement).toContain('peak power appears to be rising');
		expect(result.statement).not.toContain('average power appears');
	});

	it('expresses a supported average/peak power trade-off without explanation', () => {
		const sessions = [
			session(1, 480, 980),
			session(2, 490, 960),
			session(3, 500, 940),
			session(4, 510, 920),
			session(5, 520, 900)
		];
		const result = buildPowerSynthesisEvidence(buildPowerEvidence(sessions), buildPowerPeakEvidence(sessions));

		expect(result.state).toBe('supported-synthesis');
		expect(result.statement).toContain('average power is rising');
		expect(result.statement).toContain('peak power is falling');
		expect(result.statement).not.toMatch(/because|caused|due to/i);
	});

	it('expresses reinforcing supported findings without inventing a coaching verdict', () => {
		const sessions = [
			session(1, 480, 900),
			session(2, 490, 920),
			session(3, 500, 940),
			session(4, 510, 960),
			session(5, 520, 980)
		];
		const result = buildPowerSynthesisEvidence(buildPowerEvidence(sessions), buildPowerPeakEvidence(sessions));

		expect(result.state).toBe('supported-synthesis');
		expect(result.statement).toContain('and peak power is rising');
		expect(result.statement).not.toMatch(/should|train|focus on/i);
	});

	it('retains disclosure metadata for both supporting claims', () => {
		const sessions = [
			session(1, 480, 900),
			session(2, 490, 920),
			session(3, 500, 940),
			session(4, 510, 960),
			session(5, 520, 980)
		];
		const result = buildPowerSynthesisEvidence(buildPowerEvidence(sessions), buildPowerPeakEvidence(sessions));

		expect(result.supportingClaims).toHaveLength(2);
		expect(result.supportingClaims[0].sourceSessionIds).toEqual(sessions.map((item) => item.sessionId));
		expect(result.supportingClaims[1].supportedSessionCount).toBe(5);
		expect(result.supportingClaims[1].windowSize).toBe(5);
	});
});

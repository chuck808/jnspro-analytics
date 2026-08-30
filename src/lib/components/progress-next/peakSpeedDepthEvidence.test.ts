import { describe, expect, it } from 'vitest';
import { buildPeakSpeedDepthEvidence } from './peakSpeedDepthEvidence';
import { buildPeakSpeedEvidence, type PeakSpeedSessionPoint } from './peakSpeedEvidence';

function session(id: string, bestPeakSpeedMs: number | null): PeakSpeedSessionPoint {
	return {
		id,
		timestamp: `2026-08-${id.padStart(2, '0')}T10:00:00.000Z`,
		best_peak_speed_ms: bestPeakSpeedMs,
		avg_peak_speed_ms: bestPeakSpeedMs
	};
}

describe('buildPeakSpeedDepthEvidence', () => {
	it('keeps absent validated speed unavailable', () => {
		const depth = buildPeakSpeedDepthEvidence(
			buildPeakSpeedEvidence([session('1', null), session('2', 0)])
		);

		expect(depth.stage).toBe('unavailable');
		expect(depth.supportedSessionCount).toBe(0);
		expect(depth.unlocks).toEqual({
			measurement: false,
			history: false,
			direction: false,
			comparisonProof: false
		});
	});

	it('keeps one validated speed session at building measurement depth', () => {
		const depth = buildPeakSpeedDepthEvidence(
			buildPeakSpeedEvidence([session('1', null), session('2', 8.4)])
		);

		expect(depth.stage).toBe('building');
		expect(depth.supportedSessionCount).toBe(1);
		expect(depth.totalSessionCount).toBe(2);
		expect(depth.unlocks).toEqual({
			measurement: true,
			history: false,
			direction: false,
			comparisonProof: false
		});
	});

	it('unlocks developing history and comparison only from an earned directional finding', () => {
		const evidence = buildPeakSpeedEvidence([session('1', 8), session('2', 8.8)]);
		const depth = buildPeakSpeedDepthEvidence(evidence);

		expect(evidence.finding?.direction).toBe('improving');
		expect(depth.stage).toBe('developing');
		expect(depth.unlocks).toEqual({
			measurement: true,
			history: true,
			direction: true,
			comparisonProof: true
		});
	});

	it('does not let mature total account history promote sparse validated-speed evidence', () => {
		const sessions = Array.from({ length: 12 }, (_, index) =>
			session(String(index + 1), index === 11 ? 8.6 : null)
		);
		const evidence = buildPeakSpeedEvidence(sessions);
		const depth = buildPeakSpeedDepthEvidence(evidence);

		expect(evidence.supportedSessionCount).toBe(1);
		expect(evidence.totalSessionCount).toBe(12);
		expect(evidence.finding).toBeNull();
		expect(depth.stage).toBe('building');
		expect(depth.totalSessionCount).toBe(12);
		expect(depth.unlocks.history).toBe(false);
		expect(depth.unlocks.direction).toBe(false);
		expect(depth.unlocks.comparisonProof).toBe(false);
	});

	it('preserves the full-history Peak Speed authority without adding a depth window', () => {
		const evidence = buildPeakSpeedEvidence([
			session('1', 8),
			session('2', 8.1),
			session('3', 8.2),
			session('4', 8.3),
			session('5', 8.4),
			session('6', 8.5),
			session('7', 8.6)
		]);
		const depth = buildPeakSpeedDepthEvidence(evidence);

		expect(evidence.finding?.historicalBestSpeedMs).toBeCloseTo(8.15, 5);
		expect(evidence.finding?.recentBestSpeedMs).toBeCloseTo(8.5, 5);
		expect(depth.stage).toBe('developing');
		expect(depth.supportedSessionCount).toBe(7);
		expect(depth.unlocks.direction).toBe(true);
	});
});

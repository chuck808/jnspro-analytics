import { describe, expect, it } from 'vitest';
import { buildPeakSpeedEvidence, type PeakSpeedSessionPoint } from './peakSpeedEvidence';

function session(
	id: string,
	bestPeakSpeedMs: number | null,
	avgPeakSpeedMs: number | null = bestPeakSpeedMs
): PeakSpeedSessionPoint {
	return {
		id,
		timestamp: `2026-08-${id.padStart(2, '0')}T10:00:00.000Z`,
		best_peak_speed_ms: bestPeakSpeedMs,
		avg_peak_speed_ms: avgPeakSpeedMs
	};
}

describe('buildPeakSpeedEvidence', () => {
	it('keeps absent validated speed honest', () => {
		const model = buildPeakSpeedEvidence([
			session('1', null),
			session('2', 0),
			session('3', Number.NaN)
		]);

		expect(model.state).toBe('absent');
		expect(model.supportedSessionCount).toBe(0);
		expect(model.bestSpeedMs).toBeNull();
		expect(model.latestBestSpeedMs).toBeNull();
		expect(model.history).toEqual([]);
		expect(model.finding).toBeNull();
	});

	it('exposes one validated session as measurement without direction', () => {
		const model = buildPeakSpeedEvidence([session('1', null), session('2', 8.4, 8.1)]);

		expect(model.state).toBe('measured');
		expect(model.supportedSessionCount).toBe(1);
		expect(model.totalSessionCount).toBe(2);
		expect(model.bestSpeedMs).toBe(8.4);
		expect(model.latestBestSpeedMs).toBe(8.4);
		expect(model.history).toEqual([
			expect.objectContaining({ id: '2', bestSpeedMs: 8.4, averageSpeedMs: 8.1 })
		]);
		expect(model.finding).toBeNull();
	});

	it('uses validated session best speed and higher-is-better engine direction', () => {
		const model = buildPeakSpeedEvidence([
			session('1', 8, 7.8),
			session('2', 9, 7.7)
		]);

		expect(model.state).toBe('directional-finding');
		expect(model.finding).toEqual({
			direction: 'improving',
			changePercent: 12.5,
			recentBestSpeedMs: 9,
			historicalBestSpeedMs: 8
		});
	});

	it('filters unsupported speed sessions before cross-session comparison', () => {
		const model = buildPeakSpeedEvidence([
			session('1', 8),
			session('2', null),
			session('3', 8.2),
			session('4', 0),
			session('5', 8.4)
		]);

		expect(model.supportedSessionCount).toBe(3);
		expect(model.totalSessionCount).toBe(5);
		expect(model.history.map((point) => point.id)).toEqual(['1', '3', '5']);
		expect(model.finding?.recentBestSpeedMs).toBe(8.4);
		expect(model.finding?.historicalBestSpeedMs).toBe(8.1);
	});

	it('uses the full supported history rather than inheriting the Reaction five-session window', () => {
		const model = buildPeakSpeedEvidence([
			session('1', 8),
			session('2', 8.1),
			session('3', 8.2),
			session('4', 8.3),
			session('5', 8.4),
			session('6', 8.5),
			session('7', 8.6)
		]);

		expect(model.supportedSessionCount).toBe(7);
		expect(model.history).toHaveLength(7);
		expect(model.finding?.historicalBestSpeedMs).toBeCloseTo(8.15, 5);
		expect(model.finding?.recentBestSpeedMs).toBeCloseTo(8.5, 5);
	});
});

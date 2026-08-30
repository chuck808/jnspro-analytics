import { describe, expect, it } from 'vitest';
import { buildPeakSpeedEvidence } from './peakSpeedEvidence';
import { buildPeakSpeedSupportingSessions } from './peakSpeedSupportingSessions';

function session(id: string, best: number | null, average: number | null = null) {
	return {
		id,
		timestamp: `2026-08-${id.padStart(2, '0')}T10:00:00.000Z`,
		best_peak_speed_ms: best,
		avg_peak_speed_ms: average
	};
}

describe('buildPeakSpeedSupportingSessions', () => {
	it('shows the measured session without inventing direction membership', () => {
		const evidence = buildPeakSpeedEvidence([session('1', 8.4, 8.1), session('2', null)]);
		const proof = buildPeakSpeedSupportingSessions(evidence);

		expect(proof.directionSessionIds).toEqual([]);
		expect(proof.sessions).toEqual([
			{
				id: '1',
				timestamp: '2026-08-01T10:00:00.000Z',
				bestSpeedMs: 8.4,
				averageSpeedMs: 8.1,
				inDirectionComparison: false
			}
		]);
	});

	it('traces a two-session finding to both supported sessions only', () => {
		const evidence = buildPeakSpeedEvidence([
			session('1', 8, 7.8),
			session('2', null),
			session('3', 8.8, 8.2)
		]);
		const proof = buildPeakSpeedSupportingSessions(evidence);

		expect(proof.directionSessionIds).toEqual(['1', '3']);
		expect(proof.sessions.map((item) => item.id)).toEqual(['3', '1']);
		expect(proof.sessions.every((item) => item.inDirectionComparison)).toBe(true);
	});

	it('preserves the full supported history for a seven-session finding', () => {
		const evidence = buildPeakSpeedEvidence([
			session('1', 8.0),
			session('2', 8.1),
			session('3', 8.2),
			session('4', 8.3),
			session('5', 8.4),
			session('6', 8.5),
			session('7', 8.6)
		]);
		const proof = buildPeakSpeedSupportingSessions(evidence);

		expect(proof.directionSessionIds).toEqual(['1', '2', '3', '4', '5', '6', '7']);
		expect(proof.sessions.map((item) => item.id)).toEqual(['7', '6', '5', '4', '3', '2', '1']);
		expect(proof.sessions.every((item) => item.inDirectionComparison)).toBe(true);
	});

	it('cannot promote unsupported account sessions into proof membership', () => {
		const evidence = buildPeakSpeedEvidence([
			...Array.from({ length: 11 }, (_, index) => session(String(index + 1), null)),
			session('12', 8.7)
		]);
		const proof = buildPeakSpeedSupportingSessions(evidence);

		expect(evidence.totalSessionCount).toBe(12);
		expect(evidence.supportedSessionCount).toBe(1);
		expect(proof.directionSessionIds).toEqual([]);
		expect(proof.sessions).toHaveLength(1);
		expect(proof.sessions[0].id).toBe('12');
		expect(proof.sessions[0].inDirectionComparison).toBe(false);
	});
});

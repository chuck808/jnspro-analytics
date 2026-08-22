import { describe, expect, it } from 'vitest';
import { median, selectSyncPulseCandidate } from './videoSync';

describe('median', () => {
	it('handles odd and even length arrays', () => {
		expect(median([1, 3, 2])).toBe(2);
		expect(median([1, 2, 3, 4])).toBe(2.5);
	});

	it('returns 0 for an empty array', () => {
		expect(median([])).toBe(0);
	});
});

describe('selectSyncPulseCandidate', () => {
	function times(n: number, intervalS = 0.1) {
		return Array.from({ length: n }, (_, i) => i * intervalS);
	}

	it('anchors a 120ms-style white pulse to its leading edge', () => {
		// At 20ms sampling, a 120ms full-white cue spans roughly six samples.
		// Gate zero is the first bright sample (0.20s), not the plateau peak.
		const t = times(24, 0.02);
		const luminances = [
			20, 20, 21, 20, 20, 19, 20, 20, 21, 20,
			90, 93, 95, 94, 96, 95,
			38, 22, 20, 20, 21, 20, 20, 20
		];
		const candidate = selectSyncPulseCandidate(luminances, t);
		expect(candidate).not.toBeNull();
		expect(candidate!.index).toBe(10);
		expect(candidate!.offsetS).toBeCloseTo(0.2, 5);
	});

	it('accepts the same finite pulse shape at coarse 100ms sampling', () => {
		const luminances = [20, 20, 21, 90, 88, 21, 20, 20];
		const candidate = selectSyncPulseCandidate(luminances, times(8));
		expect(candidate).not.toBeNull();
		expect(candidate!.offsetS).toBeCloseTo(0.3, 5);
	});

	it('rejects a sustained brightness change', () => {
		const luminances = [20, 21, 19, 20, 90, 89, 91, 90, 88, 90];
		expect(selectSyncPulseCandidate(luminances, times(10))).toBeNull();
	});

	it('rejects ordinary low-amplitude video noise', () => {
		const luminances = [50, 52, 49, 51, 53, 48, 50, 51, 49, 52];
		expect(selectSyncPulseCandidate(luminances, times(10))).toBeNull();
	});

	it('uses the clip noise floor as well as an absolute threshold', () => {
		const luminances = [50, 65, 48, 62, 51, 64, 49, 63, 50, 61];
		expect(selectSyncPulseCandidate(luminances, times(10))).toBeNull();
	});

	it('chooses the strongest qualifying finite pulse when multiple rises exist', () => {
		const luminances = [20, 20, 60, 21, 20, 95, 93, 40, 20, 21, 20];
		const candidate = selectSyncPulseCandidate(luminances, times(11));
		expect(candidate).not.toBeNull();
		expect(candidate!.index).toBe(5);
	});

	it('does not require decay within a fixed number of fine samples', () => {
		const t = times(20, 0.02);
		const luminances = [
			20, 20, 20, 20, 20,
			90, 92, 93, 94, 93, 92, 91,
			25, 21, 20, 20, 20, 20, 20, 20
		];
		const candidate = selectSyncPulseCandidate(luminances, t);
		expect(candidate).not.toBeNull();
		expect(candidate!.index).toBe(5);
	});

	it('returns null when a bright rise occurs too late to confirm decay', () => {
		const luminances = [20, 21, 19, 20, 90];
		expect(selectSyncPulseCandidate(luminances, times(5))).toBeNull();
	});

	it('returns null for mismatched or insufficient samples', () => {
		expect(selectSyncPulseCandidate([10, 90], times(2))).toBeNull();
		expect(selectSyncPulseCandidate([], [])).toBeNull();
		expect(selectSyncPulseCandidate([20, 90, 20], [0, 0.1])).toBeNull();
	});
});

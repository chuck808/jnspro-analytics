import { describe, expect, it } from 'vitest';
import { median, selectFlashCandidate } from './videoSync';

describe('median', () => {
	it('handles odd and even length arrays', () => {
		expect(median([1, 3, 2])).toBe(2);
		expect(median([1, 2, 3, 4])).toBe(2.5);
	});

	it('returns 0 for an empty array', () => {
		expect(median([])).toBe(0);
	});
});

describe('selectFlashCandidate', () => {
	function times(n: number, intervalS = 0.1) {
		return Array.from({ length: n }, (_, i) => i * intervalS);
	}

	it('detects a clean, isolated flash against a low-noise baseline', () => {
		// Baseline ~20, flash spikes to ~90, decays back down over 2 samples.
		const luminances = [20, 21, 19, 20, 90, 40, 22, 21, 20, 19];
		const candidate = selectFlashCandidate(luminances, times(10));
		expect(candidate).not.toBeNull();
		expect(candidate!.index).toBe(4);
		expect(candidate!.offsetS).toBeCloseTo(0.4, 5);
	});

	it('rejects a sustained brightness change (lights switching on and staying on)', () => {
		// Jumps from ~20 to ~90 and STAYS there — no decay — should be rejected
		// even though the delta itself is large.
		const luminances = [20, 21, 19, 20, 90, 89, 91, 90, 88, 90];
		const candidate = selectFlashCandidate(luminances, times(10));
		expect(candidate).toBeNull();
	});

	it('rejects noise that never exceeds the relative threshold', () => {
		// Realistic handheld-footage jitter — deltas are all small and similar
		// in magnitude, nothing should read as a flash.
		const luminances = [50, 52, 49, 51, 53, 48, 50, 51, 49, 52];
		const candidate = selectFlashCandidate(luminances, times(10));
		expect(candidate).toBeNull();
	});

	it('is robust to a noisy baseline — requires the spike to clear the *relative* threshold, not just the absolute one', () => {
		// Noise floor itself has ~15-unit swings, so a same-sized "spike" must
		// not be mistaken for a flash — the 3x-median-delta check should catch
		// this even though a naive fixed threshold might not.
		const luminances = [50, 65, 48, 62, 51, 64, 49, 63, 50, 61];
		const candidate = selectFlashCandidate(luminances, times(10));
		expect(candidate).toBeNull();
	});

	it('picks the single largest qualifying spike when there are multiple bright frames', () => {
		const luminances = [20, 20, 60, 21, 20, 95, 40, 20, 21, 20];
		const candidate = selectFlashCandidate(luminances, times(10));
		expect(candidate).not.toBeNull();
		expect(candidate!.index).toBe(5);
	});

	it('returns null for fewer than 3 samples', () => {
		expect(selectFlashCandidate([10, 90], times(2))).toBeNull();
		expect(selectFlashCandidate([], [])).toBeNull();
	});

	it('returns null when the decay lookahead runs off the end of the array', () => {
		// Flash is the very last sample — no room to confirm decay — must not
		// be accepted on faith.
		const luminances = [20, 21, 19, 20, 90];
		const candidate = selectFlashCandidate(luminances, times(5));
		expect(candidate).toBeNull();
	});
});

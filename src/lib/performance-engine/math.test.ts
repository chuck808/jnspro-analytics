import { describe, expect, it } from 'vitest';
import { clamp, coefficientOfVariation, max, mean, min, round, standardDeviation } from './math';

describe('mean/min/max', () => {
	it('ignores non-finite values', () => {
		expect(mean([1, 2, NaN, 3])).toBe(2);
		expect(min([5, Infinity, 1])).toBe(1);
		expect(max([5, -Infinity, 1])).toBe(5);
	});

	it('returns null for empty/all-invalid input', () => {
		expect(mean([])).toBeNull();
		expect(min([NaN])).toBeNull();
		expect(max([])).toBeNull();
	});
});

describe('standardDeviation / coefficientOfVariation', () => {
	it('is zero for identical values', () => {
		expect(standardDeviation([5, 5, 5])).toBe(0);
		expect(coefficientOfVariation([5, 5, 5])).toBe(0);
	});

	it('computes CV as %-of-mean spread', () => {
		// values: 8, 10, 12 -> mean 10, population sd sqrt(8/3)
		const sd = standardDeviation([8, 10, 12])!;
		expect(sd).toBeCloseTo(Math.sqrt(8 / 3), 6);
		expect(coefficientOfVariation([8, 10, 12])).toBeCloseTo((sd / 10) * 100, 6);
	});

	it('returns null when mean is zero (division by zero guard)', () => {
		expect(coefficientOfVariation([0, 0, 0])).toBeNull();
	});
});

describe('round', () => {
	it('rounds to the given number of places', () => {
		expect(round(1.2345, 2)).toBe(1.23);
		expect(round(1.005, 2)).toBe(1);
	});

	it('passes through null/undefined/non-finite as null', () => {
		expect(round(null)).toBeNull();
		expect(round(undefined)).toBeNull();
		expect(round(NaN)).toBeNull();
		expect(round(Infinity)).toBeNull();
	});
});

describe('clamp', () => {
	it('clamps to the default 0-100 range', () => {
		expect(clamp(150)).toBe(100);
		expect(clamp(-10)).toBe(0);
		expect(clamp(50)).toBe(50);
	});

	it('respects custom bounds', () => {
		expect(clamp(5, 10, 20)).toBe(10);
		expect(clamp(25, 10, 20)).toBe(20);
	});
});

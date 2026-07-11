import { describe, expect, it } from 'vitest';
import {
	MINOR_CONSENT_AGE_THRESHOLD,
	calculateAge,
	isValidPastDate,
	requiresParentalConsent
} from '../consent';
import { generateConsentToken } from './consent';

describe('calculateAge', () => {
	it('computes whole years elapsed', () => {
		expect(calculateAge('2010-01-01', new Date('2026-01-01'))).toBe(16);
	});

	it('has not had a birthday yet this year', () => {
		expect(calculateAge('2010-12-31', new Date('2026-01-01'))).toBe(15);
	});

	it('birthday is today', () => {
		expect(calculateAge('2010-07-11', new Date('2026-07-11'))).toBe(16);
	});
});

describe('requiresParentalConsent', () => {
	it('requires consent strictly below the threshold', () => {
		const justUnder = new Date();
		justUnder.setFullYear(justUnder.getFullYear() - (MINOR_CONSENT_AGE_THRESHOLD - 1));
		expect(requiresParentalConsent(justUnder.toISOString().slice(0, 10))).toBe(true);
	});

	it('does not require consent at/above the threshold', () => {
		const atThreshold = new Date();
		atThreshold.setFullYear(atThreshold.getFullYear() - MINOR_CONSENT_AGE_THRESHOLD);
		expect(requiresParentalConsent(atThreshold.toISOString().slice(0, 10))).toBe(false);
	});
});

describe('generateConsentToken', () => {
	it('produces a 64-char hex string, unique per call', () => {
		const a = generateConsentToken();
		const b = generateConsentToken();
		expect(a).toMatch(/^[0-9a-f]{64}$/);
		expect(a).not.toBe(b);
	});
});

describe('isValidPastDate', () => {
	it('rejects garbage input', () => {
		expect(isValidPastDate('not-a-date')).toBe(false);
	});

	it('rejects future dates', () => {
		const future = new Date();
		future.setFullYear(future.getFullYear() + 1);
		expect(isValidPastDate(future.toISOString().slice(0, 10))).toBe(false);
	});

	it('rejects unrealistically old dates', () => {
		expect(isValidPastDate('1850-01-01')).toBe(false);
	});

	it('accepts a reasonable birth date', () => {
		expect(isValidPastDate('2012-06-15')).toBe(true);
	});
});

import { describe, expect, it } from 'vitest';
import { decideAcceptOutcome } from './coachLinks';

describe('decideAcceptOutcome', () => {
	it('blocks when date of birth is missing — never silently skips the minor check', () => {
		const outcome = decideAcceptOutcome(null, 'parent@example.com');
		expect(outcome.kind).toBe('blocked');
		if (outcome.kind === 'blocked') {
			expect(outcome.error).toContain('date of birth');
		}
	});

	it('goes active immediately for an adult rider, regardless of parent email', () => {
		const adultDob = new Date();
		adultDob.setFullYear(adultDob.getFullYear() - 25);
		const outcome = decideAcceptOutcome(adultDob.toISOString().split('T')[0], null);
		expect(outcome).toEqual({ kind: 'active' });
	});

	it('blocks a minor rider with no parent/guardian email on file', () => {
		const minorDob = new Date();
		minorDob.setFullYear(minorDob.getFullYear() - 12);
		const outcome = decideAcceptOutcome(minorDob.toISOString().split('T')[0], null);
		expect(outcome.kind).toBe('blocked');
		if (outcome.kind === 'blocked') {
			expect(outcome.error).toContain('parent/guardian email');
		}
	});

	it('requires parent approval for a minor rider with a parent/guardian email on file', () => {
		const minorDob = new Date();
		minorDob.setFullYear(minorDob.getFullYear() - 12);
		const outcome = decideAcceptOutcome(minorDob.toISOString().split('T')[0], 'parent@example.com');
		expect(outcome).toEqual({ kind: 'pending_parent' });
	});
});

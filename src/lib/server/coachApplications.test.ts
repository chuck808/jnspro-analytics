import { describe, expect, it } from 'vitest';
import { canReviewApplication, decideSubmitOutcome } from './coachApplications';

describe('decideSubmitOutcome', () => {
	it('blocks submitting while an application is already pending review', () => {
		const outcome = decideSubmitOutcome('pending');
		expect(outcome.kind).toBe('blocked');
		if (outcome.kind === 'blocked') {
			expect(outcome.error).toContain('pending review');
		}
	});

	it('blocks submitting when already an approved coach', () => {
		const outcome = decideSubmitOutcome('approved');
		expect(outcome.kind).toBe('blocked');
		if (outcome.kind === 'blocked') {
			expect(outcome.error).toContain('already an approved coach');
		}
	});

	it('allows submitting from none', () => {
		expect(decideSubmitOutcome('none')).toEqual({ kind: 'ok' });
	});

	it('allows re-submitting after a rejection — no cooldown', () => {
		expect(decideSubmitOutcome('rejected')).toEqual({ kind: 'ok' });
	});
});

describe('canReviewApplication', () => {
	it('allows reviewing a pending application', () => {
		expect(canReviewApplication('pending')).toBe(true);
	});

	it('blocks re-reviewing an already-approved application', () => {
		expect(canReviewApplication('approved')).toBe(false);
	});

	it('blocks re-reviewing an already-rejected application', () => {
		expect(canReviewApplication('rejected')).toBe(false);
	});
});

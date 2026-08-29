import { describe, expect, it } from 'vitest';
import { buildReactionRepeatabilityEvidence } from './reactionRepeatabilityEvidence';

function session(index: number, cv: number | null) {
	return {
		id: `session-${index}`,
		timestamp: `2026-08-${String(index).padStart(2, '0')}T10:00:00.000Z`,
		reaction_cv: cv
	};
}

describe('buildReactionRepeatabilityEvidence', () => {
	it('does not treat a session without CV as repeatability evidence', () => {
		const result = buildReactionRepeatabilityEvidence([session(1, null)]);

		expect(result.state).toBe('measured');
		expect(result.supportedSessionCount).toBe(0);
		expect(result.latestCv).toBeNull();
		expect(result.presentation.statement).toContain('at least two reaction observations');
	});

	it('treats one measured CV as a fact, not history', () => {
		const result = buildReactionRepeatabilityEvidence([session(1, 4.2)]);

		expect(result.state).toBe('measured');
		expect(result.supportedSessionCount).toBe(1);
		expect(result.latestCv).toBe(4.2);
		expect(result.finding).toBeNull();
	});

	it('uses two supported sessions as observed history with no trend claim', () => {
		const result = buildReactionRepeatabilityEvidence([session(1, 4.2), session(2, 3.8)]);

		expect(result.state).toBe('observed-history');
		expect(result.finding).toBeNull();
		expect(result.presentation.statement).toContain('No repeatability trend claim yet');
	});

	it('uses three to four supported sessions as early-signal territory', () => {
		const result = buildReactionRepeatabilityEvidence([
			session(1, 6),
			session(2, 5),
			session(3, 4),
			session(4, 3)
		]);

		expect(result.state).toBe('early-signal');
		expect(result.finding?.direction).toBe('improving');
		expect(result.presentation.label).toBe('Early signal');
	});

	it('uses five supported sessions as supported-finding territory', () => {
		const result = buildReactionRepeatabilityEvidence([
			session(1, 6),
			session(2, 5.5),
			session(3, 5),
			session(4, 4.5),
			session(5, 4)
		]);

		expect(result.state).toBe('supported-finding');
		expect(result.finding?.direction).toBe('improving');
		expect(result.presentation.statement).toContain('Lower CV means less within-session variation');
	});

	it('keeps missing-CV sessions out of supported coverage', () => {
		const result = buildReactionRepeatabilityEvidence([
			session(1, 6),
			session(2, null),
			session(3, 5),
			session(4, null),
			session(5, 4)
		]);

		expect(result.totalSessionCount).toBe(5);
		expect(result.supportedSessionCount).toBe(3);
		expect(result.history.map((point) => point.id)).toEqual(['session-1', 'session-3', 'session-5']);
		expect(result.state).toBe('early-signal');
	});

	it('does not attach fixed quality labels to measured CV values', () => {
		const result = buildReactionRepeatabilityEvidence([
			session(1, 1),
			session(2, 2),
			session(3, 3),
			session(4, 4),
			session(5, 5)
		]);

		expect(result.presentation.statement).not.toMatch(/tight|developing|variable/i);
	});
});

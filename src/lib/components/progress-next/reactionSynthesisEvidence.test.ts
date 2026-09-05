import { describe, expect, it } from 'vitest';
import { buildReactionEvidence } from './reactionEvidence';
import { buildReactionRepeatabilityEvidence } from './reactionRepeatabilityEvidence';
import { buildReactionSynthesisEvidence } from './reactionSynthesisEvidence';

function session(index: number, avg: number, cv: number | null) {
	return {
		id: `session-${index}`,
		timestamp: `2026-08-${String(index).padStart(2, '0')}T10:00:00.000Z`,
		best_reaction_ms: avg - 20,
		avg_reaction_ms: avg,
		reaction_cv: cv
	};
}

describe('buildReactionSynthesisEvidence', () => {
	it('stays building until both directional findings exist', () => {
		const sessions = [session(1, 500, 4), session(2, 490, 3.8)];
		const result = buildReactionSynthesisEvidence(
			buildReactionEvidence(sessions),
			buildReactionRepeatabilityEvidence(sessions)
		);

		expect(result.state).toBe('building');
		expect(result.statement).toContain('shown separately');
	});

	it('caps synthesis at early while preserving each claim confidence posture', () => {
		const reactionSessions = [
			session(1, 520, null),
			session(2, 510, null),
			session(3, 500, 5),
			session(4, 490, 4.5),
			session(5, 480, 4)
		];
		const result = buildReactionSynthesisEvidence(
			buildReactionEvidence(reactionSessions),
			buildReactionRepeatabilityEvidence(reactionSessions)
		);

		expect(result.state).toBe('early-synthesis');
		expect(result.statement).toContain('reaction is getting quicker');
		expect(result.statement).toContain('repeatability appears to be improving');
		expect(result.statement).not.toContain('reaction appears');
	});

	it('expresses a supported reaction/repeatability trade-off without explanation', () => {
		const sessions = [
			session(1, 520, 3),
			session(2, 510, 3.5),
			session(3, 500, 4),
			session(4, 490, 4.5),
			session(5, 480, 5)
		];
		const result = buildReactionSynthesisEvidence(
			buildReactionEvidence(sessions),
			buildReactionRepeatabilityEvidence(sessions)
		);

		expect(result.state).toBe('supported-synthesis');
		expect(result.statement).toContain('reaction is getting quicker');
		expect(result.statement).toContain('repeatability is declining');
		expect(result.statement).not.toMatch(/because|caused|due to/i);
	});

	it('expresses reinforcing supported findings without inventing a coaching verdict', () => {
		const sessions = [
			session(1, 520, 6),
			session(2, 510, 5.5),
			session(3, 500, 5),
			session(4, 490, 4.5),
			session(5, 480, 4)
		];
		const result = buildReactionSynthesisEvidence(
			buildReactionEvidence(sessions),
			buildReactionRepeatabilityEvidence(sessions)
		);

		expect(result.state).toBe('supported-synthesis');
		expect(result.statement).toContain('and repeatability is improving');
		expect(result.statement).not.toMatch(/should|train|focus on/i);
	});

	it('retains disclosure metadata for both supporting claims', () => {
		const sessions = [
			session(1, 520, 6),
			session(2, 510, 5.5),
			session(3, 500, 5),
			session(4, 490, 4.5),
			session(5, 480, 4)
		];
		const result = buildReactionSynthesisEvidence(
			buildReactionEvidence(sessions),
			buildReactionRepeatabilityEvidence(sessions)
		);

		expect(result.supportingClaims).toHaveLength(2);
		expect(result.supportingClaims[0].sourceSessionIds).toEqual(sessions.map((item) => item.id));
		expect(result.supportingClaims[1].supportedSessionCount).toBe(5);
		expect(result.supportingClaims[1].windowSize).toBe(5);
	});
});

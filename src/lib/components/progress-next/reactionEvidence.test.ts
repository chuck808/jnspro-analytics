import { describe, expect, it } from 'vitest';
import { buildReactionEvidence, type ReactionSessionPoint } from './reactionEvidence';

function makeSession(index: number, averageMs = 400 - index * 12): ReactionSessionPoint {
	return {
		id: `session-${index + 1}`,
		timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
		best_reaction_ms: averageMs - 20,
		avg_reaction_ms: averageMs,
		reaction_cv: 3 + index * 0.1
	};
}

describe('buildReactionEvidence', () => {
	it('keeps one supported session as measured evidence only', () => {
		const model = buildReactionEvidence([makeSession(0)]);

		expect(model.state).toBe('measured');
		expect(model.supportedSessionCount).toBe(1);
		expect(model.finding).toBeNull();
	});

	it('shows exactly two supported sessions as observed history without a trend claim', () => {
		const model = buildReactionEvidence([makeSession(0), makeSession(1)]);

		expect(model.state).toBe('observed-history');
		expect(model.history).toHaveLength(2);
		expect(model.finding).toBeNull();
	});

	it('treats four supported sessions as an early signal', () => {
		const model = buildReactionEvidence(Array.from({ length: 4 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('early-signal');
		expect(model.supportedSessionCount).toBe(4);
		expect(model.windowSize).toBe(4);
		expect(model.finding?.direction).toBe('improving');
	});

	it('treats seven supported sessions as a supported finding over the recent five-session window', () => {
		const model = buildReactionEvidence(Array.from({ length: 7 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('supported-finding');
		expect(model.supportedSessionCount).toBe(7);
		expect(model.windowSize).toBe(5);
		expect(model.finding?.direction).toBe('improving');
	});

	it('does not turn twelve-session maturity into a wider or higher-authority reaction window', () => {
		const model = buildReactionEvidence(Array.from({ length: 12 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('supported-finding');
		expect(model.supportedSessionCount).toBe(12);
		expect(model.totalSessionCount).toBe(12);
		expect(model.windowSize).toBe(5);
	});

	it('uses supported reaction observations rather than total session count for evidence maturity', () => {
		const sessions = Array.from({ length: 7 }, (_, index) => makeSession(index));
		for (let index = 2; index < sessions.length; index += 1) {
			sessions[index] = { ...sessions[index], avg_reaction_ms: null, best_reaction_ms: null, reaction_cv: null };
		}

		const model = buildReactionEvidence(sessions);

		expect(model.totalSessionCount).toBe(7);
		expect(model.supportedSessionCount).toBe(2);
		expect(model.state).toBe('observed-history');
		expect(model.finding).toBeNull();
	});
});

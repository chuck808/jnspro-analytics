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
		expect(model.presentation.label).toBe('Measured');
		expect(model.presentation.statement).toContain('reaction baseline');
	});

	it('does not claim measured reaction evidence when none exists', () => {
		const empty = buildReactionEvidence([]);
		const unsupported = buildReactionEvidence([
			{
				...makeSession(0),
				best_reaction_ms: null,
				avg_reaction_ms: null,
				reaction_cv: null
			}
		]);

		for (const model of [empty, unsupported]) {
			expect(model.state).toBe('measured');
			expect(model.bestReactionMs).toBeNull();
			expect(model.supportedSessionCount).toBe(0);
			expect(model.presentation.statement).toBe(
				'No supported reaction measurement is available yet. Reaction history will appear as usable evidence is recorded.'
			);
		}
	});

	it('keeps measured best-reaction evidence distinct from average-reaction history', () => {
		const model = buildReactionEvidence([
			{
				...makeSession(0),
				best_reaction_ms: 180,
				avg_reaction_ms: null,
				reaction_cv: null
			}
		]);

		expect(model.bestReactionMs).toBe(180);
		expect(model.supportedSessionCount).toBe(0);
		expect(model.presentation.statement).toBe(
			'Measured reaction evidence is available, but average-reaction history is still building.'
		);
	});

	it('shows exactly two supported sessions as observed history without a trend claim', () => {
		const model = buildReactionEvidence([makeSession(0), makeSession(1)]);

		expect(model.state).toBe('observed-history');
		expect(model.history).toHaveLength(2);
		expect(model.finding).toBeNull();
		expect(model.presentation.label).toBe('Observed history');
		expect(model.presentation.statement).toBe('2 supported sessions show reaction history. No trend claim yet.');
	});

	it('treats four supported sessions as an early signal', () => {
		const model = buildReactionEvidence(Array.from({ length: 4 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('early-signal');
		expect(model.supportedSessionCount).toBe(4);
		expect(model.windowSize).toBe(4);
		expect(model.finding?.direction).toBe('improving');
		expect(model.presentation.label).toBe('Early signal');
		expect(model.presentation.statement).toContain('appears');
		expect(model.presentation.statement).toContain('latest 4 supported sessions');
	});

	it('treats seven supported sessions as a supported finding over the recent five-session window', () => {
		const model = buildReactionEvidence(Array.from({ length: 7 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('supported-finding');
		expect(model.supportedSessionCount).toBe(7);
		expect(model.windowSize).toBe(5);
		expect(model.finding?.direction).toBe('improving');
		expect(model.presentation.label).toBe('Supported finding');
		expect(model.presentation.statement).not.toContain('appears');
		expect(model.presentation.statement).toContain('latest 5 supported sessions');
	});

	it('does not turn twelve-session maturity into a wider or higher-authority reaction window', () => {
		const model = buildReactionEvidence(Array.from({ length: 12 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('supported-finding');
		expect(model.supportedSessionCount).toBe(12);
		expect(model.totalSessionCount).toBe(12);
		expect(model.windowSize).toBe(5);
		expect(model.presentation.statement).toContain('latest 5 supported sessions');
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
		expect(model.presentation.statement).toBe('2 supported sessions show reaction history. No trend claim yet.');
	});

	it('keeps a measured PB even when that session cannot support average-reaction inference', () => {
		const sessions = [
			makeSession(0, 250),
			makeSession(1, 230),
			{
				...makeSession(2, 220),
				best_reaction_ms: 150,
				avg_reaction_ms: null,
				reaction_cv: null
			}
		];

		const model = buildReactionEvidence(sessions);

		expect(model.bestReactionMs).toBe(150);
		expect(model.supportedSessionCount).toBe(2);
		expect(model.state).toBe('observed-history');
		expect(model.finding).toBeNull();
	});

	it('uses cautious wording for an early declining signal', () => {
		const sessions = [makeSession(0, 250), makeSession(1, 260), makeSession(2, 275), makeSession(3, 290)];
		const model = buildReactionEvidence(sessions);

		expect(model.finding?.direction).toBe('declining');
		expect(model.presentation.label).toBe('Early signal');
		expect(model.presentation.statement).toContain('appears');
		expect(model.presentation.statement).toContain('higher than');
	});
});

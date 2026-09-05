import { describe, expect, it } from 'vitest';
import { buildReactionEvidence, type ReactionSessionPoint } from './reactionEvidence';
import { buildReactionRepeatabilityEvidence } from './reactionRepeatabilityEvidence';
import { buildReactionContextEvidence } from './reactionContextEvidence';
import { buildReactionSynthesisEvidence } from './reactionSynthesisEvidence';
import { buildReactionDepthEvidence } from './reactionDepthEvidence';

function makeSession(index: number): ReactionSessionPoint {
	return {
		id: `session-${index + 1}`,
		timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
		best_reaction_ms: 380 - index * 12,
		avg_reaction_ms: 400 - index * 12,
		reaction_cv: 8 - index * 0.3
	};
}

function build(sessions: ReactionSessionPoint[]) {
	const reaction = buildReactionEvidence(sessions);
	const repeatability = buildReactionRepeatabilityEvidence(sessions);
	const context = buildReactionContextEvidence([], reaction.supportedSessionCount, sessions.length);
	const synthesis = buildReactionSynthesisEvidence(reaction, repeatability);
	return buildReactionDepthEvidence(reaction, repeatability, context, synthesis);
}

describe('buildReactionDepthEvidence', () => {
	it('keeps the two-session persona in a purposeful building state', () => {
		const model = build([makeSession(0), makeSession(1)]);

		expect(model.stage).toBe('building');
		expect(model.presentation.label).toBe('Building');
		expect(model.unlocks.history).toBe(true);
		expect(model.unlocks.direction).toBe(false);
		expect(model.unlocks.repeatabilityHistory).toBe(true);
		expect(model.unlocks.repeatabilityDirection).toBe(false);
		expect(model.unlocks.context).toBe(false);
		expect(model.unlocks.synthesis).toBe(false);
	});

	it('maps the four-session persona to emerging without upgrading individual evidence', () => {
		const model = build(Array.from({ length: 4 }, (_, index) => makeSession(index)));

		expect(model.stage).toBe('emerging');
		expect(model.unlocks.direction).toBe(true);
		expect(model.unlocks.repeatabilityDirection).toBe(true);
		expect(model.unlocks.context).toBe(false);
		expect(model.unlocks.synthesis).toBe(true);
	});

	it('maps seven supported sessions to developing while context analysis is still unavailable', () => {
		const model = build(Array.from({ length: 7 }, (_, index) => makeSession(index)));

		expect(model.stage).toBe('developing');
		expect(model.unlocks.direction).toBe(true);
		expect(model.unlocks.context).toBe(false);
	});

	it('maps twelve supported sessions to established once contextual analysis has genuinely run', () => {
		const model = build(Array.from({ length: 12 }, (_, index) => makeSession(index)));

		expect(model.stage).toBe('established');
		expect(model.unlocks.context).toBe(true);
		// No significant contextual finding is required for overall depth to be
		// established: a truthful no-pattern result means the analysis has run.
	});

	it('does not let twelve total sessions promote Reaction when only two support it', () => {
		const sessions = Array.from({ length: 12 }, (_, index) => makeSession(index)).map(
			(session, index) =>
				index < 2
					? session
					: { ...session, avg_reaction_ms: null, best_reaction_ms: null, reaction_cv: null }
		);
		const model = build(sessions);

		expect(model.totalSessionCount).toBe(12);
		expect(model.supportedSessionCount).toBe(2);
		expect(model.stage).toBe('building');
		expect(model.unlocks.direction).toBe(false);
		expect(model.unlocks.context).toBe(false);
	});
});

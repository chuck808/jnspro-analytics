import { describe, expect, it } from 'vitest';
import { buildReactionEvidence, type ReactionSessionPoint } from './reactionEvidence';
import { buildReactionRepeatabilityEvidence } from './reactionRepeatabilityEvidence';
import { buildReactionSupportingSessions } from './reactionSupportingSessions';

function makeSession(index: number, reactionCv: number | null = 8 - index * 0.2): ReactionSessionPoint {
	return {
		id: `session-${index + 1}`,
		timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
		best_reaction_ms: 380 - index * 10,
		avg_reaction_ms: 400 - index * 10,
		reaction_cv: reactionCv
	};
}

function build(sessions: ReactionSessionPoint[]) {
	return buildReactionSupportingSessions(
		buildReactionEvidence(sessions),
		buildReactionRepeatabilityEvidence(sessions)
	);
}

describe('buildReactionSupportingSessions', () => {
	it('does not invent direction support before a finding exists', () => {
		const model = build([makeSession(0), makeSession(1)]);

		expect(model.reactionDirectionSessionIds).toEqual([]);
		expect(model.repeatabilityDirectionSessionIds).toEqual([]);
		expect(model.sessions.every((session) => !session.supportsReactionDirection)).toBe(true);
		expect(model.sessions.every((session) => !session.supportsRepeatabilityDirection)).toBe(true);
	});

	it('traces a supported Reaction finding to the exact latest evidence window', () => {
		const model = build(Array.from({ length: 7 }, (_, index) => makeSession(index)));

		expect(model.reactionDirectionSessionIds).toEqual([
			'session-3',
			'session-4',
			'session-5',
			'session-6',
			'session-7'
		]);
		expect(
			model.sessions.filter((session) => session.supportsReactionDirection).map((session) => session.id)
		).toEqual(['session-7', 'session-6', 'session-5', 'session-4', 'session-3']);
	});

	it('keeps sparse repeatability support independent from established Reaction history', () => {
		const sessions = Array.from({ length: 12 }, (_, index) =>
			makeSession(index, index < 2 ? 8 - index * 0.2 : null)
		);
		const model = build(sessions);

		expect(model.sessions).toHaveLength(12);
		expect(model.reactionDirectionSessionIds).toHaveLength(5);
		expect(model.repeatabilityDirectionSessionIds).toEqual([]);
		expect(model.sessions.filter((session) => session.supportsRepeatability).map((session) => session.id)).toEqual([
			'session-2',
			'session-1'
		]);
		expect(model.sessions.every((session) => !session.supportsRepeatabilityDirection)).toBe(true);
	});

	it('uses only CV-supported history for the repeatability direction window', () => {
		const sessions = Array.from({ length: 8 }, (_, index) =>
			makeSession(index, index === 4 || index === 6 ? null : 8 - index * 0.2)
		);
		const model = build(sessions);

		expect(model.repeatabilityDirectionSessionIds).toEqual([
			'session-2',
			'session-3',
			'session-4',
			'session-6',
			'session-8'
		]);
		expect(model.sessions.find((session) => session.id === 'session-7')?.supportsRepeatability).toBe(false);
		expect(model.sessions.find((session) => session.id === 'session-6')?.supportsRepeatabilityDirection).toBe(true);
	});
});

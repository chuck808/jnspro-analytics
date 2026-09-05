import type { ReactionEvidenceModel } from './reactionEvidence';
import type { ReactionRepeatabilityEvidenceModel } from './reactionRepeatabilityEvidence';

export interface ReactionSupportingSession {
	id: string;
	timestamp: string;
	averageReactionMs: number;
	bestReactionMs: number | null;
	reactionCv: number | null;
	supportsReactionDirection: boolean;
	supportsRepeatability: boolean;
	supportsRepeatabilityDirection: boolean;
}

export interface ReactionSupportingSessionsModel {
	sessions: ReactionSupportingSession[];
	reactionDirectionSessionIds: string[];
	repeatabilityDirectionSessionIds: string[];
}

/**
 * Join the frozen Reaction evidence histories into session-level proof for the
 * deep dive. This adapter deliberately performs no trend, confidence or
 * eligibility calculation of its own: membership comes only from the histories
 * and window sizes already exposed by the Reaction evidence models.
 */
export function buildReactionSupportingSessions(
	reaction: ReactionEvidenceModel,
	repeatability: ReactionRepeatabilityEvidenceModel
): ReactionSupportingSessionsModel {
	const reactionDirectionSessionIds = reaction.finding
		? reaction.history.slice(-reaction.windowSize).map((session) => session.id)
		: [];
	const repeatabilityDirectionSessionIds = repeatability.finding
		? repeatability.history.slice(-repeatability.windowSize).map((session) => session.id)
		: [];
	const reactionDirectionIds = new Set(reactionDirectionSessionIds);
	const repeatabilityDirectionIds = new Set(repeatabilityDirectionSessionIds);
	const repeatabilityById = new Map(repeatability.history.map((session) => [session.id, session]));

	return {
		reactionDirectionSessionIds,
		repeatabilityDirectionSessionIds,
		sessions: reaction.history
			.map((session) => {
				const repeatabilitySession = repeatabilityById.get(session.id);
				return {
					id: session.id,
					timestamp: session.timestamp,
					averageReactionMs: session.averageReactionMs,
					bestReactionMs: session.bestReactionMs,
					reactionCv: repeatabilitySession?.cv ?? null,
					supportsReactionDirection: reactionDirectionIds.has(session.id),
					supportsRepeatability: repeatabilitySession !== undefined,
					supportsRepeatabilityDirection: repeatabilityDirectionIds.has(session.id)
				};
			})
			.reverse()
	};
}

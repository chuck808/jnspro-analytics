import type { ReactionEvidenceModel } from './reactionEvidence';
import type { ReactionRepeatabilityEvidenceModel } from './reactionRepeatabilityEvidence';

export type ReactionSynthesisEvidenceState = 'building' | 'early-synthesis' | 'supported-synthesis';

export interface ReactionSynthesisEvidenceModel {
	state: ReactionSynthesisEvidenceState;
	statement: string;
	supportingClaims: Array<{
		kind: 'reaction-direction' | 'repeatability-direction';
		evidenceState: ReactionEvidenceModel['state'] | ReactionRepeatabilityEvidenceModel['state'];
		supportedSessionCount: number;
		windowSize: number;
		sourceSessionIds: string[];
	}>;
}

function directionPhrase(
	direction: 'improving' | 'declining' | 'stable',
	metric: 'reaction' | 'repeatability',
	early: boolean
) {
	if (metric === 'reaction') {
		if (direction === 'stable') return early ? 'reaction appears broadly stable' : 'reaction is broadly stable';
		if (direction === 'improving') return early ? 'reaction appears to be getting quicker' : 'reaction is getting quicker';
		return early ? 'reaction appears to be getting slower' : 'reaction is getting slower';
	}

	if (direction === 'stable') return early ? 'repeatability appears broadly stable' : 'repeatability is broadly stable';
	if (direction === 'improving') return early ? 'repeatability appears to be improving' : 'repeatability is improving';
	return early ? 'repeatability appears to be declining' : 'repeatability is declining';
}

/**
 * Combine Reaction direction and repeatability direction without exceeding the
 * weakest essential supporting claim. Aggregate synthesis state is weakest-link
 * capped, while each clause keeps the confidence posture of its own evidence.
 * Context is intentionally excluded: a contextual association may accompany
 * this synthesis but does not explain it.
 */
export function buildReactionSynthesisEvidence(
	reaction: ReactionEvidenceModel,
	repeatability: ReactionRepeatabilityEvidenceModel
): ReactionSynthesisEvidenceModel {
	const supportingClaims: ReactionSynthesisEvidenceModel['supportingClaims'] = [
		{
			kind: 'reaction-direction',
			evidenceState: reaction.state,
			supportedSessionCount: reaction.supportedSessionCount,
			windowSize: reaction.windowSize,
			sourceSessionIds: reaction.history.map((session) => session.id)
		},
		{
			kind: 'repeatability-direction',
			evidenceState: repeatability.state,
			supportedSessionCount: repeatability.supportedSessionCount,
			windowSize: repeatability.windowSize,
			sourceSessionIds: repeatability.history.map((session) => session.id)
		}
	];

	if (!reaction.finding || !repeatability.finding) {
		return {
			state: 'building',
			statement: 'Reaction and repeatability evidence are shown separately until both support a directional comparison.',
			supportingClaims
		};
	}

	const supported = reaction.state === 'supported-finding' && repeatability.state === 'supported-finding';
	const state: ReactionSynthesisEvidenceState = supported ? 'supported-synthesis' : 'early-synthesis';
	const reactionPhrase = directionPhrase(
		reaction.finding.direction,
		'reaction',
		reaction.state !== 'supported-finding'
	);
	const repeatabilityPhrase = directionPhrase(
		repeatability.finding.direction,
		'repeatability',
		repeatability.state !== 'supported-finding'
	);

	let statement = `${reactionPhrase}, while ${repeatabilityPhrase}.`;
	if (reaction.finding.direction === repeatability.finding.direction) {
		statement = `${reactionPhrase}, and ${repeatabilityPhrase}.`;
	}
	if (reaction.finding.direction === 'stable' || repeatability.finding.direction === 'stable') {
		statement = `${reactionPhrase}, while ${repeatabilityPhrase}.`;
	}

	return { state, statement, supportingClaims };
}

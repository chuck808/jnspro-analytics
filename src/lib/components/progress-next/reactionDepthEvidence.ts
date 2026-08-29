import type { ReactionEvidenceModel } from './reactionEvidence';
import type { ReactionRepeatabilityEvidenceModel } from './reactionRepeatabilityEvidence';
import type { ReactionContextEvidenceModel } from './reactionContextEvidence';
import type { ReactionSynthesisEvidenceModel } from './reactionSynthesisEvidence';

export type ReactionDepthStage = 'building' | 'emerging' | 'developing' | 'established';

export interface ReactionDepthEvidenceModel {
	stage: ReactionDepthStage;
	supportedSessionCount: number;
	totalSessionCount: number;
	presentation: {
		label: 'Building' | 'Emerging' | 'Developing' | 'Established';
		headline: string;
		guidance: string;
	};
	unlocks: {
		history: boolean;
		direction: boolean;
		repeatabilityHistory: boolean;
		repeatabilityDirection: boolean;
		context: boolean;
		synthesis: boolean;
	};
}

/**
 * Describe how much Reaction deep-dive presentation has been earned.
 *
 * This is deliberately a presentation adapter over the already-frozen Reaction
 * evidence boundaries. It does not invent a second confidence model and it does
 * not use total session count to promote Reaction maturity. The familiar
 * 2/4/7/12-session views remain acceptance personas; real unlocks come from the
 * evidence models that support each claim.
 */
export function buildReactionDepthEvidence(
	reaction: ReactionEvidenceModel,
	repeatability: ReactionRepeatabilityEvidenceModel,
	context: ReactionContextEvidenceModel,
	synthesis: ReactionSynthesisEvidenceModel
): ReactionDepthEvidenceModel {
	let stage: ReactionDepthStage = 'building';
	if (reaction.state === 'early-signal') stage = 'emerging';
	else if (reaction.state === 'supported-finding') {
		stage = context.state === 'absent' ? 'developing' : 'established';
	}

	const presentation =
		stage === 'building'
			? {
					label: 'Building' as const,
					headline: 'Building your Reaction baseline',
					guidance: 'Measured evidence comes first. Direction and deeper interpretation appear only when supported.'
				}
			: stage === 'emerging'
				? {
						label: 'Emerging' as const,
						headline: 'An early Reaction signal is emerging',
						guidance: 'Direction can now be described cautiously. Keep adding supported sessions to strengthen the comparison.'
					}
				: stage === 'developing'
					? {
							label: 'Developing' as const,
							headline: 'Reaction progression is supported',
							guidance: 'The Reaction direction is supported. Other evidence layers still keep their own independent requirements.'
						}
					: {
							label: 'Established' as const,
							headline: 'Reaction evidence has reached established depth',
							guidance: 'Longitudinal Reaction evidence is supported and contextual analysis has run. Individual findings still retain their own confidence.'
						};

	return {
		stage,
		supportedSessionCount: reaction.supportedSessionCount,
		totalSessionCount: reaction.totalSessionCount,
		presentation,
		unlocks: {
			history: reaction.history.length >= 2,
			direction: reaction.finding !== null,
			repeatabilityHistory: repeatability.history.length >= 2,
			repeatabilityDirection: repeatability.finding !== null,
			context: context.state !== 'absent',
			synthesis: synthesis.state !== 'building'
		}
	};
}

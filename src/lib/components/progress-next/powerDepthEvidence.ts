import type { PowerEvidenceModel } from './powerEvidence';
import type { PowerPeakEvidenceModel } from './powerPeakEvidence';
import type { PowerContextEvidenceModel } from './powerContextEvidence';
import type { PowerSynthesisEvidenceModel } from './powerSynthesisEvidence';

export type PowerDepthStage = 'building' | 'emerging' | 'developing' | 'established';

export interface PowerDepthEvidenceModel {
	stage: PowerDepthStage;
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
		peakHistory: boolean;
		peakDirection: boolean;
		context: boolean;
		synthesis: boolean;
	};
}

function describeDepth(stage: PowerDepthStage): PowerDepthEvidenceModel['presentation'] {
	if (stage === 'building') {
		return {
			label: 'Building',
			headline: 'Building your Power baseline',
			guidance:
				'Measured evidence comes first. Direction and deeper interpretation appear only when supported.'
		};
	}

	if (stage === 'emerging') {
		return {
			label: 'Emerging',
			headline: 'An early Power signal is emerging',
			guidance:
				'Direction can now be described cautiously. Keep adding supported sessions to strengthen the comparison.'
		};
	}

	if (stage === 'developing') {
		return {
			label: 'Developing',
			headline: 'Power progression is supported',
			guidance:
				'The average-power direction is supported. Other evidence layers still keep their own independent requirements.'
		};
	}

	return {
		label: 'Established',
		headline: 'Power evidence has reached established depth',
		guidance:
			'Longitudinal Power evidence is supported and contextual analysis has run. Individual findings still retain their own confidence.'
	};
}

/**
 * Describe how much Power deep-dive presentation has been earned.
 *
 * This is deliberately a presentation adapter over the already-frozen Power
 * evidence boundaries, mirroring reactionDepthEvidence.ts's shape. It does not
 * invent a second confidence model and it does not use total session count to
 * promote Power maturity. The 2/4/7/12-session views used for live
 * verification are acceptance personas, not new thresholds baked in here.
 */
export function buildPowerDepthEvidence(
	power: PowerEvidenceModel,
	peak: PowerPeakEvidenceModel,
	context: PowerContextEvidenceModel,
	synthesis: PowerSynthesisEvidenceModel
): PowerDepthEvidenceModel {
	let stage: PowerDepthStage = 'building';
	if (power.state === 'early-signal') stage = 'emerging';
	else if (power.state === 'supported-finding') {
		stage = context.state === 'absent' ? 'developing' : 'established';
	}

	return {
		stage,
		supportedSessionCount: power.supportedSessionCount,
		totalSessionCount: power.totalSessionCount,
		presentation: describeDepth(stage),
		unlocks: {
			history: power.history.length >= 2,
			direction: power.finding !== null,
			peakHistory: peak.history.length >= 2,
			peakDirection: peak.finding !== null,
			context: context.state !== 'absent',
			synthesis: synthesis.state !== 'building'
		}
	};
}

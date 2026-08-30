import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';

export type PeakSpeedDepthStage = 'unavailable' | 'building' | 'developing';

export interface PeakSpeedDepthEvidenceModel {
	stage: PeakSpeedDepthStage;
	supportedSessionCount: number;
	totalSessionCount: number;
	presentation: {
		label: 'Unavailable' | 'Building' | 'Developing';
		headline: string;
		guidance: string;
	};
	unlocks: {
		measurement: boolean;
		history: boolean;
		direction: boolean;
		comparisonProof: boolean;
	};
}

function describeDepth(stage: PeakSpeedDepthStage): PeakSpeedDepthEvidenceModel['presentation'] {
	if (stage === 'unavailable') {
		return {
			label: 'Unavailable',
			headline: 'Validated Peak Speed evidence is not available yet',
			guidance:
				'Peak Speed progression appears only after a session contains validated IMU speed evidence.'
		};
	}

	if (stage === 'building') {
		return {
			label: 'Building',
			headline: 'Building your validated Peak Speed baseline',
			guidance:
				'Measured speed comes first. Cross-session direction appears only after the Peak Speed evidence model supports it.'
		};
	}

	return {
		label: 'Developing',
		headline: 'Peak Speed direction is supported',
		guidance:
			'Validated cross-session speed direction is available. Deeper layers remain absent until they have their own evidence contracts.'
	};
}

/**
 * Describe how much Peak Speed deep-dive presentation has actually been earned.
 *
 * This adapter intentionally exposes fewer stages than Reaction. Peak Speed
 * currently has a validated measurement/history/direction evidence boundary,
 * but no independently validated repeatability, context or synthesis layers.
 * Total account history is reported for provenance only and never promotes
 * Peak Speed maturity.
 */
export function buildPeakSpeedDepthEvidence(
	evidence: PeakSpeedEvidenceModel
): PeakSpeedDepthEvidenceModel {
	let stage: PeakSpeedDepthStage = 'unavailable';
	if (evidence.state === 'measured') stage = 'building';
	else if (evidence.state === 'directional-finding') stage = 'developing';

	return {
		stage,
		supportedSessionCount: evidence.supportedSessionCount,
		totalSessionCount: evidence.totalSessionCount,
		presentation: describeDepth(stage),
		unlocks: {
			measurement: evidence.supportedSessionCount > 0,
			history: evidence.history.length >= 2,
			direction: evidence.finding !== null,
			comparisonProof: evidence.finding !== null
		}
	};
}

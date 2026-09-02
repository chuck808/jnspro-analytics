import type { PowerEvidenceModel } from './powerEvidence';
import type { PowerPeakEvidenceModel } from './powerPeakEvidence';

export type PowerSynthesisEvidenceState = 'building' | 'early-synthesis' | 'supported-synthesis';

export interface PowerSynthesisEvidenceModel {
	state: PowerSynthesisEvidenceState;
	statement: string;
	supportingClaims: Array<{
		kind: 'power-direction' | 'peak-power-direction';
		evidenceState: PowerEvidenceModel['state'] | PowerPeakEvidenceModel['state'];
		supportedSessionCount: number;
		windowSize: number;
		sourceSessionIds: string[];
	}>;
}

function directionPhrase(
	direction: 'improving' | 'declining' | 'stable',
	metric: 'power' | 'peak power',
	early: boolean
) {
	if (metric === 'power') {
		if (direction === 'stable') return early ? 'average power appears broadly stable' : 'average power is broadly stable';
		if (direction === 'improving') return early ? 'average power appears to be rising' : 'average power is rising';
		return early ? 'average power appears to be falling' : 'average power is falling';
	}

	if (direction === 'stable') return early ? 'peak power appears broadly stable' : 'peak power is broadly stable';
	if (direction === 'improving') return early ? 'peak power appears to be rising' : 'peak power is rising';
	return early ? 'peak power appears to be falling' : 'peak power is falling';
}

/**
 * Combine average-power direction and peak-power direction without exceeding
 * the weakest essential supporting claim. Aggregate synthesis state is
 * weakest-link capped, while each clause keeps the confidence posture of its
 * own evidence. Context is intentionally excluded: a contextual association
 * may accompany this synthesis but does not explain it.
 */
export function buildPowerSynthesisEvidence(
	power: PowerEvidenceModel,
	peak: PowerPeakEvidenceModel
): PowerSynthesisEvidenceModel {
	const supportingClaims: PowerSynthesisEvidenceModel['supportingClaims'] = [
		{
			kind: 'power-direction',
			evidenceState: power.state,
			supportedSessionCount: power.supportedSessionCount,
			windowSize: power.windowSize,
			sourceSessionIds: power.history.map((session) => session.sessionId)
		},
		{
			kind: 'peak-power-direction',
			evidenceState: peak.state,
			supportedSessionCount: peak.supportedSessionCount,
			windowSize: peak.windowSize,
			sourceSessionIds: peak.history.map((session) => session.sessionId)
		}
	];

	if (!power.finding || !peak.finding) {
		return {
			state: 'building',
			statement: 'Average power and peak power evidence are shown separately until both support a directional comparison.',
			supportingClaims
		};
	}

	const supported = power.state === 'supported-finding' && peak.state === 'supported-finding';
	const state: PowerSynthesisEvidenceState = supported ? 'supported-synthesis' : 'early-synthesis';
	const powerPhrase = directionPhrase(power.finding.direction, 'power', power.state !== 'supported-finding');
	const peakPhrase = directionPhrase(peak.finding.direction, 'peak power', peak.state !== 'supported-finding');

	let statement = `${powerPhrase}, while ${peakPhrase}.`;
	if (power.finding.direction === peak.finding.direction) {
		statement = `${powerPhrase}, and ${peakPhrase}.`;
	}
	if (power.finding.direction === 'stable' || peak.finding.direction === 'stable') {
		statement = `${powerPhrase}, while ${peakPhrase}.`;
	}

	return { state, statement, supportingClaims };
}

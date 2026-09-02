import type { PowerEvidenceModel } from './powerEvidence';
import type { PowerPeakEvidenceModel } from './powerPeakEvidence';

export interface PowerSupportingSession {
	sessionId: string;
	timestamp: string;
	averageW: number;
	peakW: number | null;
	supportsPowerDirection: boolean;
	supportsPeakPower: boolean;
	supportsPeakPowerDirection: boolean;
}

export interface PowerSupportingSessionsModel {
	sessions: PowerSupportingSession[];
	powerDirectionSessionIds: string[];
	peakPowerDirectionSessionIds: string[];
}

/**
 * Join the frozen Power evidence histories into session-level proof for the
 * deep dive. This adapter deliberately performs no trend, confidence or
 * eligibility calculation of its own: membership comes only from the
 * histories and window sizes already exposed by the Power evidence models.
 */
export function buildPowerSupportingSessions(
	power: PowerEvidenceModel,
	peak: PowerPeakEvidenceModel
): PowerSupportingSessionsModel {
	const powerDirectionSessionIds = power.finding
		? power.history.slice(-power.windowSize).map((session) => session.sessionId)
		: [];
	const peakPowerDirectionSessionIds = peak.finding
		? peak.history.slice(-peak.windowSize).map((session) => session.sessionId)
		: [];
	const powerDirectionIds = new Set(powerDirectionSessionIds);
	const peakDirectionIds = new Set(peakPowerDirectionSessionIds);
	const peakById = new Map(peak.history.map((session) => [session.sessionId, session]));

	return {
		powerDirectionSessionIds,
		peakPowerDirectionSessionIds,
		sessions: power.history
			.map((session) => {
				const peakSession = peakById.get(session.sessionId);
				return {
					sessionId: session.sessionId,
					timestamp: session.timestamp,
					averageW: session.averageW,
					peakW: peakSession?.peakW ?? null,
					supportsPowerDirection: powerDirectionIds.has(session.sessionId),
					supportsPeakPower: peakSession !== undefined,
					supportsPeakPowerDirection: peakDirectionIds.has(session.sessionId)
				};
			})
			.reverse()
	};
}

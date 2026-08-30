import type { PeakSpeedEvidenceModel } from './peakSpeedEvidence';

export interface PeakSpeedSupportingSession {
	id: string;
	timestamp: string;
	bestSpeedMs: number;
	averageSpeedMs: number | null;
	inDirectionComparison: boolean;
}

export interface PeakSpeedSupportingSessionsModel {
	sessions: PeakSpeedSupportingSession[];
	directionSessionIds: string[];
}

/**
 * Presentation-only traceability over the already-owned Peak Speed evidence.
 *
 * This adapter does not decide speed eligibility, recalculate a trend, or choose
 * another evidence window. Every row comes directly from evidence.history. When
 * a directional finding exists, that finding was calculated from the complete
 * supported history, so every supported session is part of its comparison.
 */
export function buildPeakSpeedSupportingSessions(
	evidence: PeakSpeedEvidenceModel
): PeakSpeedSupportingSessionsModel {
	const directionSessionIds = evidence.finding === null ? [] : evidence.history.map((session) => session.id);
	const directionIds = new Set(directionSessionIds);

	return {
		directionSessionIds,
		sessions: evidence.history
			.map((session) => ({
				id: session.id,
				timestamp: session.timestamp,
				bestSpeedMs: session.bestSpeedMs,
				averageSpeedMs: session.averageSpeedMs,
				inDirectionComparison: directionIds.has(session.id)
			}))
			.reverse()
	};
}

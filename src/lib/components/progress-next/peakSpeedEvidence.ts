import { calculateTrend } from '$lib/performance-engine/crossSession/trendUtils';

export type PeakSpeedEvidenceState = 'absent' | 'measured' | 'directional-finding';

export interface PeakSpeedSessionPoint {
	id: string;
	timestamp: string;
	best_peak_speed_ms: number | null;
	avg_peak_speed_ms: number | null;
}

export interface PeakSpeedEvidenceModel {
	state: PeakSpeedEvidenceState;
	supportedSessionCount: number;
	totalSessionCount: number;
	bestSpeedMs: number | null;
	latestBestSpeedMs: number | null;
	history: Array<{
		id: string;
		timestamp: string;
		bestSpeedMs: number;
		averageSpeedMs: number | null;
	}>;
	finding: null | {
		direction: 'improving' | 'declining' | 'stable';
		changePercent: number;
		recentBestSpeedMs: number;
		historicalBestSpeedMs: number;
	};
	presentation: {
		label: 'No validated speed' | 'Measured' | 'Directional finding';
		statement: string;
	};
}

function isSupportedSpeed(value: number | null): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function describePeakSpeedEvidence(
	state: PeakSpeedEvidenceState,
	supportedSessionCount: number,
	finding: PeakSpeedEvidenceModel['finding']
): PeakSpeedEvidenceModel['presentation'] {
	if (state === 'absent') {
		return {
			label: 'No validated speed',
			statement:
				'No session currently contains validated peak-speed evidence. Speed progression will appear when validated IMU speed is available.'
		};
	}

	if (state === 'measured') {
		return {
			label: 'Measured',
			statement:
				'1 session contains validated peak-speed evidence. Another supported session is needed before a cross-session direction can be described.'
		};
	}

	if (!finding) {
		return {
			label: 'Directional finding',
			statement: `${supportedSessionCount} validated speed sessions are available, but no directional finding is currently supported.`
		};
	}

	const comparison =
		finding.direction === 'stable'
			? 'broadly stable against'
			: `${Math.abs(finding.changePercent).toFixed(1)}% ${finding.direction === 'improving' ? 'higher than' : 'lower than'}`;

	return {
		label: 'Directional finding',
		statement: `Recent best peak speed is ${comparison} the earlier validated-speed comparison across ${supportedSessionCount} supported sessions.`
	};
}

/**
 * Rider-facing Peak Speed evidence boundary for /progress-next.
 *
 * SessionSummary is the authority for speed eligibility: best_peak_speed_ms is
 * populated only from analytics_valid gate runs. Cross-session direction follows
 * the existing Performance Engine speed progression semantics exactly: session
 * best speed, higher-is-better, and calculateTrend() over the full supported
 * history. This adapter does not inherit Reaction windows or maturity thresholds.
 */
export function buildPeakSpeedEvidence(sessions: PeakSpeedSessionPoint[]): PeakSpeedEvidenceModel {
	const supported = sessions.filter(
		(session): session is PeakSpeedSessionPoint & { best_peak_speed_ms: number } =>
			isSupportedSpeed(session.best_peak_speed_ms)
	);
	const bestSpeedMs =
		supported.length > 0 ? Math.max(...supported.map((session) => session.best_peak_speed_ms)) : null;
	const latest = supported.at(-1) ?? null;

	let state: PeakSpeedEvidenceState = 'absent';
	if (supported.length === 1) state = 'measured';
	else if (supported.length >= 2) state = 'directional-finding';

	let finding: PeakSpeedEvidenceModel['finding'] = null;
	if (supported.length >= 2) {
		const trend = calculateTrend(
			supported.map((session) => session.best_peak_speed_ms),
			{ higherIsBetter: true }
		);

		if (
			trend.direction !== 'unknown' &&
			trend.changePercent !== null &&
			trend.recent !== null &&
			trend.historical !== null
		) {
			finding = {
				direction: trend.direction === 'stable' ? 'stable' : trend.improving ? 'improving' : 'declining',
				changePercent: trend.changePercent,
				recentBestSpeedMs: trend.recent,
				historicalBestSpeedMs: trend.historical
			};
		}
	}

	return {
		state,
		supportedSessionCount: supported.length,
		totalSessionCount: sessions.length,
		bestSpeedMs,
		latestBestSpeedMs: latest?.best_peak_speed_ms ?? null,
		history: supported.map((session) => ({
			id: session.id,
			timestamp: session.timestamp,
			bestSpeedMs: session.best_peak_speed_ms,
			averageSpeedMs: isSupportedSpeed(session.avg_peak_speed_ms) ? session.avg_peak_speed_ms : null
		})),
		finding,
		presentation: describePeakSpeedEvidence(state, supported.length, finding)
	};
}

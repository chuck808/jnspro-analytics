import { calculateTrend } from '$lib/performance-engine/crossSession/trendUtils';
import type { PowerSessionAnalysisLike } from './powerEvidence';

export type PowerPeakEvidenceState = 'measured' | 'observed-history' | 'early-signal' | 'supported-finding';

export interface PowerPeakEvidenceModel {
	state: PowerPeakEvidenceState;
	supportedSessionCount: number;
	totalSessionCount: number;
	windowSize: number;
	latestPeakW: number | null;
	history: Array<{
		sessionId: string;
		timestamp: string;
		peakW: number;
	}>;
	finding: null | {
		direction: 'improving' | 'declining' | 'stable';
		changePercent: number;
		recentPeakW: number;
		historicalPeakW: number;
	};
	presentation: {
		label: 'Measured' | 'Observed history' | 'Early signal' | 'Supported finding';
		statement: string;
	};
}

const RECENT_WINDOW = 5;

function isFiniteNumber(value: number | null | undefined): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function peakW(session: PowerSessionAnalysisLike): number | null {
	const run = session.analysis.selectedRun;
	if (!run || run.analyticsValid !== true || !run.physics) return null;
	const value = run.physics.power?.peakW;
	return isFiniteNumber(value) ? value : null;
}

function describe(
	state: PowerPeakEvidenceState,
	supportedSessionCount: number,
	windowSize: number,
	finding: PowerPeakEvidenceModel['finding']
): PowerPeakEvidenceModel['presentation'] {
	if (state === 'measured') {
		return {
			label: 'Measured',
			statement:
				supportedSessionCount === 1
					? '1 session has a measured peak power observation. Another supported session will unlock history.'
					: 'Peak power needs at least one analytics-valid physics estimate per session before history can be measured.'
		};
	}

	if (state === 'observed-history') {
		return {
			label: 'Observed history',
			statement: `${supportedSessionCount} sessions have measured peak power. No peak-power trend claim yet.`
		};
	}

	if (!finding) {
		return {
			label: state === 'early-signal' ? 'Early signal' : 'Supported finding',
			statement: `${supportedSessionCount} sessions have measured peak power, but no direction is currently supported.`
		};
	}

	const comparison =
		finding.direction === 'stable'
			? 'broadly stable against'
			: `${Math.abs(finding.changePercent).toFixed(1)}% ${finding.direction === 'improving' ? 'higher than' : 'lower than'}`;
	const window = `within the latest ${windowSize} supported session${windowSize === 1 ? '' : 's'}`;

	return {
		label: state === 'early-signal' ? 'Early signal' : 'Supported finding',
		statement: `${state === 'early-signal' ? 'Peak power appears' : 'Peak power is'} ${comparison} the earlier comparison ${window}.`
	};
}

/**
 * Build the rider-facing Power peak evidence boundary for /progress-next.
 *
 * Peak power is the secondary axis alongside average power: not a variability
 * measure like Reaction's repeatability/CV, but an independently-gated second
 * summary statistic from the same estimatePower() physics output. A session
 * can support this axis without supporting the average-power axis, and vice
 * versa, exactly like Reaction's two independent support filters.
 */
export function buildPowerPeakEvidence(sessionAnalyses: PowerSessionAnalysisLike[]): PowerPeakEvidenceModel {
	const supported = sessionAnalyses.filter((session) => peakW(session) !== null);
	const recentSupported = supported.slice(-RECENT_WINDOW);

	let state: PowerPeakEvidenceState = 'measured';
	if (supported.length === 2) state = 'observed-history';
	else if (supported.length >= 3 && supported.length < 5) state = 'early-signal';
	else if (supported.length >= 5) state = 'supported-finding';

	let finding: PowerPeakEvidenceModel['finding'] = null;
	if (supported.length >= 3) {
		const trend = calculateTrend(
			recentSupported.map((session) => peakW(session)),
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
				recentPeakW: trend.recent,
				historicalPeakW: trend.historical
			};
		}
	}

	const windowSize = Math.min(recentSupported.length, RECENT_WINDOW);

	return {
		state,
		supportedSessionCount: supported.length,
		totalSessionCount: sessionAnalyses.length,
		windowSize,
		latestPeakW: supported.at(-1) ? peakW(supported.at(-1)!) : null,
		history: supported.map((session) => ({
			sessionId: session.sessionId,
			timestamp: session.timestamp,
			peakW: peakW(session) as number
		})),
		finding,
		presentation: describe(state, supported.length, windowSize, finding)
	};
}

import { calculateTrend } from '$lib/performance-engine/crossSession/trendUtils';

export type PowerEvidenceState = 'measured' | 'observed-history' | 'early-signal' | 'supported-finding';

export interface PowerSessionAnalysisLike {
	sessionId: string;
	timestamp: string;
	analysis: {
		selectedRun: {
			analyticsValid: boolean;
			physics: {
				power?: { peakW: number; averageW: number; estimated: true } | null;
			} | null;
		} | null;
	};
}

export interface PowerEvidenceModel {
	state: PowerEvidenceState;
	supportedSessionCount: number;
	totalSessionCount: number;
	windowSize: number;
	bestPeakPowerW: number | null;
	latestAverageW: number | null;
	latestPeakW: number | null;
	history: Array<{
		sessionId: string;
		timestamp: string;
		averageW: number;
		peakW: number | null;
	}>;
	finding: null | {
		direction: 'improving' | 'declining' | 'stable';
		changePercent: number;
		recentAverageW: number;
		historicalAverageW: number;
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

function averageW(session: PowerSessionAnalysisLike): number | null {
	const run = session.analysis.selectedRun;
	if (!run || run.analyticsValid !== true || !run.physics) return null;
	const value = run.physics.power?.averageW;
	return isFiniteNumber(value) ? value : null;
}

function peakW(session: PowerSessionAnalysisLike): number | null {
	const run = session.analysis.selectedRun;
	if (!run || run.analyticsValid !== true || !run.physics) return null;
	const value = run.physics.power?.peakW;
	return isFiniteNumber(value) ? value : null;
}

function describePowerEvidence(
	state: PowerEvidenceState,
	supportedSessionCount: number,
	windowSize: number,
	finding: PowerEvidenceModel['finding'],
	hasMeasuredPeakPower: boolean
): PowerEvidenceModel['presentation'] {
	if (state === 'measured') {
		return {
			label: 'Measured',
			statement:
				supportedSessionCount === 1
					? '1 supported session establishes an average power baseline. Another supported session will unlock observed history.'
					: hasMeasuredPeakPower
						? 'Measured peak power evidence is available, but average-power history is still building.'
						: 'No supported power measurement is available yet. Power history will appear as usable evidence is recorded.'
		};
	}

	if (state === 'observed-history') {
		return {
			label: 'Observed history',
			statement: `${supportedSessionCount} supported sessions show power history. No trend claim yet.`
		};
	}

	if (!finding) {
		return {
			label: state === 'early-signal' ? 'Early signal' : 'Supported finding',
			statement: `${supportedSessionCount} supported sessions are available, but no directional finding is currently supported.`
		};
	}

	const comparison =
		finding.direction === 'stable'
			? 'broadly stable against'
			: `${Math.abs(finding.changePercent).toFixed(1)}% ${finding.direction === 'improving' ? 'higher than' : 'lower than'}`;
	const window = `within the latest ${windowSize} supported session${windowSize === 1 ? '' : 's'}`;

	if (state === 'early-signal') {
		return {
			label: 'Early signal',
			statement: `Recent average power appears ${comparison} the earlier comparison ${window}.`
		};
	}

	return {
		label: 'Supported finding',
		statement: `Recent average power is ${comparison} the earlier comparison ${window}.`
	};
}

/**
 * Build the rider-facing Power evidence boundary for /progress-next.
 *
 * Power is estimated physics from src/lib/performance-engine/physics.ts, read
 * from each session's selectedRun only when that run's own analyticsValid flag
 * is true — Reaction's avg_reaction_ms has no equivalent direct validity flag
 * on the same object, so this gate is genuinely new, not copied by analogy.
 * Direction uses the same trend utility as the rest of this pattern, limited to
 * its default five-session recent window, with higherIsBetter true (power is
 * the opposite polarity from reaction time). Evidence class is determined from
 * supported average-power observations, never total session count alone.
 * bestPeakPowerW is a measured fact independent of that inference filter,
 * mirroring bestReactionMs.
 */
export function buildPowerEvidence(sessionAnalyses: PowerSessionAnalysisLike[]): PowerEvidenceModel {
	const supported = sessionAnalyses.filter((session) => averageW(session) !== null);
	const recentSupported = supported.slice(-RECENT_WINDOW);
	const latest = supported.at(-1) ?? null;

	const bestValues = sessionAnalyses
		.map((session) => peakW(session))
		.filter((value): value is number => value !== null);
	const bestPeakPowerW = bestValues.length > 0 ? Math.max(...bestValues) : null;

	let state: PowerEvidenceState = 'measured';
	if (supported.length === 2) state = 'observed-history';
	else if (supported.length >= 3 && supported.length < 5) state = 'early-signal';
	else if (supported.length >= 5) state = 'supported-finding';

	let finding: PowerEvidenceModel['finding'] = null;
	if (supported.length >= 3) {
		const trend = calculateTrend(
			recentSupported.map((session) => averageW(session)),
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
				recentAverageW: trend.recent,
				historicalAverageW: trend.historical
			};
		}
	}

	const windowSize = Math.min(recentSupported.length, RECENT_WINDOW);

	return {
		state,
		supportedSessionCount: supported.length,
		totalSessionCount: sessionAnalyses.length,
		windowSize,
		bestPeakPowerW,
		latestAverageW: latest ? averageW(latest) : null,
		latestPeakW: latest ? peakW(latest) : null,
		history: supported.map((session) => ({
			sessionId: session.sessionId,
			timestamp: session.timestamp,
			averageW: averageW(session) as number,
			peakW: peakW(session)
		})),
		finding,
		presentation: describePowerEvidence(state, supported.length, windowSize, finding, bestPeakPowerW !== null)
	};
}

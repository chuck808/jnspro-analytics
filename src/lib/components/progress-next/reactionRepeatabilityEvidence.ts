import { calculateTrend } from '$lib/performance-engine/crossSession/trendUtils';

export type ReactionRepeatabilityEvidenceState =
	| 'measured'
	| 'observed-history'
	| 'early-signal'
	| 'supported-finding';

export interface ReactionRepeatabilitySessionPoint {
	id: string;
	timestamp: string;
	reaction_cv: number | null;
}

export interface ReactionRepeatabilityEvidenceModel {
	state: ReactionRepeatabilityEvidenceState;
	supportedSessionCount: number;
	totalSessionCount: number;
	windowSize: number;
	latestCv: number | null;
	history: Array<{
		id: string;
		timestamp: string;
		cv: number;
	}>;
	finding: null | {
		direction: 'improving' | 'declining' | 'stable';
		changePercent: number;
		recentCv: number;
		historicalCv: number;
	};
	presentation: {
		label: 'Measured' | 'Observed history' | 'Early signal' | 'Supported finding';
		statement: string;
	};
}

const RECENT_WINDOW = 5;

function describe(
	state: ReactionRepeatabilityEvidenceState,
	supportedSessionCount: number,
	windowSize: number,
	finding: ReactionRepeatabilityEvidenceModel['finding']
): ReactionRepeatabilityEvidenceModel['presentation'] {
	if (state === 'measured') {
		return {
			label: 'Measured',
			statement:
				supportedSessionCount === 1
					? '1 session has enough reaction observations to measure within-session repeatability. Another supported session will unlock history.'
					: 'Repeatability needs at least two reaction observations within a session before session CV can be measured.'
		};
	}

	if (state === 'observed-history') {
		return {
			label: 'Observed history',
			statement: `${supportedSessionCount} sessions have measured reaction CV. No repeatability trend claim yet.`
		};
	}

	if (!finding) {
		return {
			label: state === 'early-signal' ? 'Early signal' : 'Supported finding',
			statement: `${supportedSessionCount} sessions have measured reaction CV, but no repeatability direction is currently supported.`
		};
	}

	const comparison =
		finding.direction === 'stable'
			? 'broadly stable against'
			: `${Math.abs(finding.changePercent).toFixed(1)}% ${finding.direction === 'improving' ? 'lower than' : 'higher than'}`;
	const window = `within the latest ${windowSize} supported session${windowSize === 1 ? '' : 's'}`;

	return {
		label: state === 'early-signal' ? 'Early signal' : 'Supported finding',
		statement: `${state === 'early-signal' ? 'Reaction repeatability appears' : 'Reaction repeatability is'} ${comparison} the earlier comparison ${window}. Lower CV means less within-session variation.`
	};
}

/**
 * Build the rider-facing Reaction repeatability boundary for /progress-next.
 *
 * reaction_cv is a canonical per-session measured fact from SessionSummary. A
 * session only contributes when that CV exists, which currently requires at
 * least two usable reaction observations within that session. Cross-session
 * direction uses the existing lower-is-better trend utility over up to the
 * latest five supported CV observations. No fixed CV quality benchmark is
 * asserted here.
 */
export function buildReactionRepeatabilityEvidence(
	sessions: ReactionRepeatabilitySessionPoint[]
): ReactionRepeatabilityEvidenceModel {
	const supported = sessions.filter(
		(session): session is ReactionRepeatabilitySessionPoint & { reaction_cv: number } =>
			typeof session.reaction_cv === 'number' && Number.isFinite(session.reaction_cv)
	);
	const recentSupported = supported.slice(-RECENT_WINDOW);

	let state: ReactionRepeatabilityEvidenceState = 'measured';
	if (supported.length === 2) state = 'observed-history';
	else if (supported.length >= 3 && supported.length < 5) state = 'early-signal';
	else if (supported.length >= 5) state = 'supported-finding';

	let finding: ReactionRepeatabilityEvidenceModel['finding'] = null;
	if (supported.length >= 3) {
		const trend = calculateTrend(
			recentSupported.map((session) => session.reaction_cv),
			{ higherIsBetter: false }
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
				recentCv: trend.recent,
				historicalCv: trend.historical
			};
		}
	}

	const windowSize = Math.min(recentSupported.length, RECENT_WINDOW);

	return {
		state,
		supportedSessionCount: supported.length,
		totalSessionCount: sessions.length,
		windowSize,
		latestCv: supported.at(-1)?.reaction_cv ?? null,
		history: supported.map((session) => ({
			id: session.id,
			timestamp: session.timestamp,
			cv: session.reaction_cv
		})),
		finding,
		presentation: describe(state, supported.length, windowSize, finding)
	};
}

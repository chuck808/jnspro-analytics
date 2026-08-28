import { calculateTrend } from '$lib/performance-engine/crossSession/trendUtils';

export type ReactionEvidenceState = 'measured' | 'observed-history' | 'early-signal' | 'supported-finding';

export interface ReactionSessionPoint {
	id: string;
	timestamp: string;
	best_reaction_ms: number | null;
	avg_reaction_ms: number | null;
	reaction_cv: number | null;
}

export interface ReactionEvidenceModel {
	state: ReactionEvidenceState;
	supportedSessionCount: number;
	totalSessionCount: number;
	windowSize: number;
	bestReactionMs: number | null;
	latestAverageReactionMs: number | null;
	latestReactionCv: number | null;
	history: Array<{
		id: string;
		timestamp: string;
		bestReactionMs: number | null;
		averageReactionMs: number;
		reactionCv: number | null;
	}>;
	finding: null | {
		direction: 'improving' | 'declining' | 'stable';
		changePercent: number;
		recentAverageMs: number;
		historicalAverageMs: number;
	};
	presentation: {
		label: 'Measured' | 'Observed history' | 'Early signal' | 'Supported finding';
		statement: string;
	};
}

const RECENT_WINDOW = 5;

function describeReactionEvidence(
	state: ReactionEvidenceState,
	supportedSessionCount: number,
	windowSize: number,
	finding: ReactionEvidenceModel['finding']
): ReactionEvidenceModel['presentation'] {
	if (state === 'measured') {
		return {
			label: 'Measured',
			statement:
				supportedSessionCount === 1
					? '1 supported session establishes a reaction baseline. Another supported session will unlock observed history.'
					: 'Measured reaction evidence is available, but average-reaction history is still building.'
		};
	}

	if (state === 'observed-history') {
		return {
			label: 'Observed history',
			statement: `${supportedSessionCount} supported sessions show reaction history. No trend claim yet.`
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
			: `${Math.abs(finding.changePercent).toFixed(1)}% ${finding.direction === 'improving' ? 'lower than' : 'higher than'}`;
	const window = `within the latest ${windowSize} supported session${windowSize === 1 ? '' : 's'}`;

	if (state === 'early-signal') {
		return {
			label: 'Early signal',
			statement: `Recent average reaction appears ${comparison} the earlier comparison ${window}.`
		};
	}

	return {
		label: 'Supported finding',
		statement: `Recent average reaction is ${comparison} the earlier comparison ${window}.`
	};
}

/**
 * Build the rider-facing Reaction evidence boundary for /progress-next.
 *
 * The canonical session summary remains the source of measured reaction facts.
 * Direction uses the same lower-is-better trend utility as the cross-session
 * engine, limited to its default five-session recent window. Evidence class is
 * determined from supported average-reaction observations, never total history
 * alone. Measured facts such as PB remain independent of that inference filter.
 */
export function buildReactionEvidence(sessions: ReactionSessionPoint[]): ReactionEvidenceModel {
	const supported = sessions.filter(
		(session): session is ReactionSessionPoint & { avg_reaction_ms: number } =>
			typeof session.avg_reaction_ms === 'number' && Number.isFinite(session.avg_reaction_ms)
	);
	const recentSupported = supported.slice(-RECENT_WINDOW);
	const latest = supported.at(-1) ?? null;
	const bestValues = sessions
		.map((session) => session.best_reaction_ms)
		.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

	let state: ReactionEvidenceState = 'measured';
	if (supported.length === 2) state = 'observed-history';
	else if (supported.length >= 3 && supported.length < 5) state = 'early-signal';
	else if (supported.length >= 5) state = 'supported-finding';

	let finding: ReactionEvidenceModel['finding'] = null;
	if (supported.length >= 3) {
		const trend = calculateTrend(
			recentSupported.map((session) => session.avg_reaction_ms),
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
				recentAverageMs: trend.recent,
				historicalAverageMs: trend.historical
			};
		}
	}

	const windowSize = Math.min(recentSupported.length, RECENT_WINDOW);

	return {
		state,
		supportedSessionCount: supported.length,
		totalSessionCount: sessions.length,
		windowSize,
		bestReactionMs: bestValues.length > 0 ? Math.min(...bestValues) : null,
		latestAverageReactionMs: latest?.avg_reaction_ms ?? null,
		latestReactionCv: latest?.reaction_cv ?? null,
		history: supported.map((session) => ({
			id: session.id,
			timestamp: session.timestamp,
			bestReactionMs: session.best_reaction_ms,
			averageReactionMs: session.avg_reaction_ms,
			reactionCv: session.reaction_cv
		})),
		finding,
		presentation: describeReactionEvidence(state, supported.length, windowSize, finding)
	};
}

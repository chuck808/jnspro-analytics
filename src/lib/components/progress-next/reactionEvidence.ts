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
}

const RECENT_WINDOW = 5;

/**
 * Build the rider-facing Reaction evidence boundary for /progress-next.
 *
 * The canonical session summary remains the source of measured reaction facts.
 * Direction uses the same lower-is-better trend utility as the cross-session
 * engine, limited to its default five-session recent window. Evidence class is
 * determined from supported reaction observations, never total history alone.
 */
export function buildReactionEvidence(sessions: ReactionSessionPoint[]): ReactionEvidenceModel {
	const supported = sessions.filter(
		(session): session is ReactionSessionPoint & { avg_reaction_ms: number } =>
			typeof session.avg_reaction_ms === 'number' && Number.isFinite(session.avg_reaction_ms)
	);
	const recentSupported = supported.slice(-RECENT_WINDOW);
	const latest = supported.at(-1) ?? null;
	const bestValues = supported
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

	return {
		state,
		supportedSessionCount: supported.length,
		totalSessionCount: sessions.length,
		windowSize: Math.min(recentSupported.length, RECENT_WINDOW),
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
		finding
	};
}

/**
 * Performance Engine v8.5 — Contextual Pattern Analysis
 *
 * Answers: "Does performance differ meaningfully by condition?"
 *
 * This module segments sessions by context variables (track surface, weather,
 * session focus, ride feel) and identifies patterns where a specific condition
 * consistently produces better or worse performance than others.
 *
 * Deliberately conservative:
 *   - Requires MIN_CONDITION_SESSIONS per group before surfacing any pattern
 *   - Requires a meaningful percentage difference (MIN_DIFFERENCE_PCT) before
 *     calling something a pattern vs noise
 *   - Only surfaces the strongest pattern per variable to avoid information overload
 *   - All findings are structured as CorrelationHints for the narrative engine
 *
 * These patterns feed three downstream consumers:
 *   1. The session narrative engine (correlationHints → `buildCorrelationNote`)
 *   2. The achievement detector (condition-aware PB claims)
 *   3. The analytics page contextual insight panel
 */

import type {
	SessionPerformanceSummary,
	ContextualPatterns,
	ContextualPattern,
	ConditionSegment
} from './types';

/** Minimum sessions in a condition group to surface a pattern */
const MIN_CONDITION_SESSIONS = 3;

/** Minimum percentage difference between best/worst condition to call it a pattern */
const MIN_DIFFERENCE_PCT = 5;

/**
 * Analyse contextual patterns across sessions.
 * Returns null-equivalent ContextualPatterns when insufficient context data.
 */
export function analyseContextualPatterns(
	sessions: SessionPerformanceSummary[]
): ContextualPatterns {
	// Only use sessions that have at least some context set
	const contextSessions = sessions.filter(
		(s) =>
			s.trackSurface !== null ||
			s.weatherCondition !== null ||
			s.sessionFocus !== null ||
			s.rideFeel !== null
	);

	if (contextSessions.length < MIN_CONDITION_SESSIONS * 2) {
		// Need at least two condition groups with enough data
		return {
			hasEnoughData: false,
			patterns: [],
			pbsByCondition: buildPbsByCondition(sessions)
		};
	}

	const patterns: ContextualPattern[] = [];

	// ── Track surface patterns ────────────────────────────────────────────────
	const surfacePattern = analyseVariablePattern(
		sessions,
		'trackSurface',
		(s) => s.trackSurface,
		'reactionTime'
	);
	if (surfacePattern) patterns.push(surfacePattern);

	const surfaceConsistencyPattern = analyseVariablePattern(
		sessions,
		'trackSurface',
		(s) => s.trackSurface,
		'consistency'
	);
	if (surfaceConsistencyPattern) patterns.push(surfaceConsistencyPattern);

	// ── Weather patterns ──────────────────────────────────────────────────────
	const weatherPattern = analyseVariablePattern(
		sessions,
		'weatherCondition',
		(s) => s.weatherCondition,
		'reactionTime'
	);
	if (weatherPattern) patterns.push(weatherPattern);

	// ── Session focus patterns ────────────────────────────────────────────────
	// Only compare non-testing, non-recovery focuses to avoid contamination
	const focusSessions = sessions.filter(
		(s) => s.sessionFocus !== 'testing' && s.sessionFocus !== 'recovery'
	);
	if (focusSessions.length >= MIN_CONDITION_SESSIONS * 2) {
		const focusPattern = analyseVariablePattern(
			focusSessions,
			'sessionFocus',
			(s) => s.sessionFocus,
			'sessionQuality'
		);
		if (focusPattern) patterns.push(focusPattern);
	}

	// ── Ride feel correlation ─────────────────────────────────────────────────
	// Lower feel → lower output? Or is the rider consistent regardless?
	// Feels map to numeric scores for correlation: off=1, solid=2, good=3, dialled=4, peak=5
	const feelPattern = analyseRideFeelPattern(sessions);
	if (feelPattern) patterns.push(feelPattern);

	return {
		hasEnoughData: patterns.length > 0,
		patterns,
		pbsByCondition: buildPbsByCondition(sessions)
	};
}

/**
 * Segment sessions by a categorical variable and find the best/worst condition.
 */
function analyseVariablePattern(
	sessions: SessionPerformanceSummary[],
	variable: ContextualPattern['variable'],
	getValue: (s: SessionPerformanceSummary) => string | null,
	metric: ContextualPattern['metric']
): ContextualPattern | null {
	// Group sessions by condition value
	const groups = new Map<string, SessionPerformanceSummary[]>();
	for (const s of sessions) {
		const val = getValue(s);
		if (!val) continue;
		if (!groups.has(val)) groups.set(val, []);
		groups.get(val)!.push(s);
	}

	// Filter to groups with enough sessions
	const qualifyingGroups = [...groups.entries()].filter(
		([, ss]) => ss.length >= MIN_CONDITION_SESSIONS
	);

	if (qualifyingGroups.length < 2) return null;

	// Compute metric for each qualifying group
	const segments: ConditionSegment[] = qualifyingGroups.map(([condition, ss]) => ({
		condition,
		sessionCount: ss.length,
		bestReactionMs: min(
			ss
				.map((s) => s.bestReactionTimeSec)
				.filter(notNull)
				.map((v) => v * 1000)
		),
		avgReactionMs: avg(
			ss
				.map((s) => s.avgReactionTimeSec)
				.filter(notNull)
				.map((v) => v * 1000)
		),
		avgConsistencyCV: avg(ss.map((s) => s.repeatabilityScore).filter(notNull)),
		avgSessionQuality: avg(ss.map((s) => s.sessionQuality).filter(notNull))
	}));

	// Rank by metric — lower reaction is better, higher consistency/quality is better
	let ranked: ConditionSegment[];
	if (metric === 'reactionTime') {
		ranked = segments
			.filter((s) => s.avgReactionMs !== null)
			.sort((a, b) => (a.avgReactionMs ?? Infinity) - (b.avgReactionMs ?? Infinity));
	} else if (metric === 'consistency') {
		ranked = segments
			.filter((s) => s.avgConsistencyCV !== null)
			.sort((a, b) => (b.avgConsistencyCV ?? 0) - (a.avgConsistencyCV ?? 0));
	} else {
		ranked = segments
			.filter((s) => s.avgSessionQuality !== null)
			.sort((a, b) => (b.avgSessionQuality ?? 0) - (a.avgSessionQuality ?? 0));
	}

	if (ranked.length < 2) return null;

	const best = ranked[0];
	const worst = ranked[ranked.length - 1];

	// Calculate meaningful difference
	let differencePercent: number | null = null;
	let bestValue: number | null;
	let worstValue: number | null;

	if (metric === 'reactionTime') {
		bestValue = best.avgReactionMs;
		worstValue = worst.avgReactionMs;
		if (bestValue !== null && worstValue !== null && worstValue > 0) {
			differencePercent = ((worstValue - bestValue) / worstValue) * 100;
		}
	} else if (metric === 'consistency') {
		bestValue = best.avgConsistencyCV;
		worstValue = worst.avgConsistencyCV;
		if (bestValue !== null && worstValue !== null && bestValue > 0) {
			differencePercent = ((bestValue - worstValue) / bestValue) * 100;
		}
	} else {
		bestValue = best.avgSessionQuality;
		worstValue = worst.avgSessionQuality;
		if (bestValue !== null && worstValue !== null && bestValue > 0) {
			differencePercent = ((bestValue - worstValue) / bestValue) * 100;
		}
	}

	if (differencePercent === null || differencePercent < MIN_DIFFERENCE_PCT) return null;

	const totalSessions = segments.reduce((s, g) => s + g.sessionCount, 0);
	const confidence = totalSessions >= 10 ? 'high' : totalSessions >= 6 ? 'moderate' : 'low';
	const strength =
		differencePercent >= 15 ? 'strong' : differencePercent >= 8 ? 'moderate' : 'weak';

	const metricLabel =
		metric === 'reactionTime'
			? 'reaction time'
			: metric === 'consistency'
				? 'consistency'
				: 'session quality';

	const finding = buildFindingText(
		variable,
		metric,
		best.condition,
		worst.condition,
		differencePercent,
		metricLabel
	);

	return {
		variable,
		metric,
		finding,
		direction: 'better',
		bestCondition: best.condition,
		worstCondition: worst.condition,
		differencePercent,
		sessionCount: totalSessions,
		confidence,
		correlationHint:
			strength !== 'weak'
				? {
						variable,
						value: best.condition,
						metric: metricLabel,
						direction: 'better',
						strength,
						sessionCount: totalSessions
					}
				: null
	};
}

/**
 * Analyse whether ride feel correlates with performance.
 * Maps ordinal feel values to scores and checks if high feel → better output.
 */
function analyseRideFeelPattern(sessions: SessionPerformanceSummary[]): ContextualPattern | null {
	const FEEL_SCORE: Record<string, number> = {
		off: 1,
		solid: 2,
		good: 3,
		dialled: 4,
		peak: 5
	};

	const paired = sessions
		.filter((s) => s.rideFeel && s.bestReactionTimeSec !== null)
		.map((s) => ({
			feelScore: FEEL_SCORE[s.rideFeel!] ?? null,
			reactionMs: s.bestReactionTimeSec! * 1000,
			sessionQuality: s.sessionQuality
		}))
		.filter((p) => p.feelScore !== null);

	if (paired.length < MIN_CONDITION_SESSIONS * 2) return null;

	// Split into high feel (dialled/peak) vs low feel (off/solid)
	const highFeel = paired.filter((p) => p.feelScore! >= 4);
	const lowFeel = paired.filter((p) => p.feelScore! <= 2);

	if (highFeel.length < MIN_CONDITION_SESSIONS || lowFeel.length < MIN_CONDITION_SESSIONS)
		return null;

	const avgHighReaction = avg(highFeel.map((p) => p.reactionMs));
	const avgLowReaction = avg(lowFeel.map((p) => p.reactionMs));

	if (avgHighReaction === null || avgLowReaction === null) return null;

	const differencePercent = ((avgLowReaction - avgHighReaction) / avgLowReaction) * 100;

	// Only surface if there's a meaningful difference — many riders perform
	// consistently regardless of feel, which is itself worth knowing but not
	// worth a pattern card. Only surface positive correlation.
	if (Math.abs(differencePercent) < MIN_DIFFERENCE_PCT) return null;

	const totalSessions = paired.length;
	const confidence = totalSessions >= 10 ? 'high' : 'moderate';
	const strength = Math.abs(differencePercent) >= 15 ? 'strong' : 'moderate';

	if (differencePercent > 0) {
		// High feel → better reaction (positive correlation)
		return {
			variable: 'rideFeel',
			metric: 'reactionTime',
			finding: `Reaction times are ${differencePercent.toFixed(0)}% better on high-readiness days (dialled/peak) vs low-readiness days. Subjective feel is a reliable predictor of output for this rider.`,
			direction: 'better',
			bestCondition: 'dialled/peak',
			worstCondition: 'off/solid',
			differencePercent,
			sessionCount: totalSessions,
			confidence,
			correlationHint: {
				variable: 'rideFeel',
				value: 'dialled',
				metric: 'reaction time',
				direction: 'better',
				strength,
				sessionCount: totalSessions
			}
		};
	} else {
		// No meaningful feel→output correlation — resilient rider
		return {
			variable: 'rideFeel',
			metric: 'reactionTime',
			finding: `Reaction times are consistent regardless of how the session felt — no meaningful difference between high and low readiness days. This indicates strong mental resilience.`,
			direction: 'neutral',
			bestCondition: null,
			worstCondition: null,
			differencePercent: Math.abs(differencePercent),
			sessionCount: totalSessions,
			confidence,
			correlationHint: null // Neutral patterns don't feed correlation hints
		};
	}
}

/**
 * Build PBs segmented by surface condition.
 * Used by the achievement detector for condition-aware PB claims.
 */
function buildPbsByCondition(
	sessions: SessionPerformanceSummary[]
): ContextualPatterns['pbsByCondition'] {
	const pbs: ContextualPatterns['pbsByCondition'] = {};

	const surfaceSessions = sessions.filter((s) => s.trackSurface !== null);
	const surfaces = [...new Set(surfaceSessions.map((s) => s.trackSurface!))];

	for (const surface of surfaces) {
		const group = surfaceSessions.filter((s) => s.trackSurface === surface);
		const reactions = group
			.map((s) => s.bestReactionTimeSec)
			.filter((v): v is number => v !== null)
			.map((v) => v * 1000);

		pbs[surface] = {
			surface,
			bestReactionMs: reactions.length > 0 ? Math.min(...reactions) : null,
			sessionCount: group.length
		};
	}

	return pbs;
}

/**
 * Build human-readable finding text for a condition pattern.
 */
function buildFindingText(
	variable: ContextualPattern['variable'],
	metric: ContextualPattern['metric'],
	bestCondition: string,
	worstCondition: string,
	diffPct: number,
	metricLabel: string
): string {
	const varLabel: Record<string, string> = {
		trackSurface: 'track surface',
		weatherCondition: 'weather',
		sessionFocus: 'session focus',
		rideFeel: 'readiness'
	};

	return (
		`${metricLabel} is ${diffPct.toFixed(0)}% better on ${bestCondition} than ${worstCondition} ` +
		`(${varLabel[variable] ?? variable} correlation). ` +
		`Compare sessions on similar ${varLabel[variable] ?? variable} for a fair read.`
	);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function notNull<T>(v: T | null | undefined): v is T {
	return v !== null && v !== undefined;
}

function avg(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((s, v) => s + v, 0) / values.length;
}

function min(values: number[]): number | null {
	if (values.length === 0) return null;
	return Math.min(...values);
}

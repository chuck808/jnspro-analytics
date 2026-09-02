export interface WheelieRunLike {
	session_id: string;
	reaction_time_ms: number | null;
	front_wheel_lifted: boolean | null;
	analytics_valid: boolean | null;
}

export type WheeliePatternEvidenceState = 'absent' | 'no-pattern' | 'contextual-finding';

export interface WheeliePatternEvidenceModel {
	state: WheeliePatternEvidenceState;
	wheelieRunCount: number;
	wheelieSessionCount: number;
	nonWheelieRunCount: number;
	nonWheelieSessionCount: number;
	finding: null | {
		direction: 'wheelie-faster' | 'wheelie-slower';
		wheelieAverageReactionMs: number;
		nonWheelieAverageReactionMs: number;
		differenceMs: number;
		differencePercent: number;
	};
	presentation: {
		label: 'Not enough data' | 'No meaningful pattern' | 'Contextual finding';
		statement: string;
	};
}

/** Reuses the Reaction-context per-group sample floor already established in
 *  reactionContextEvidence.ts (supportedReactionSessionCount >= 5), applied here
 *  to run-level counts since this comparison is at the raw-run grain. */
const MIN_GROUP_RUN_COUNT = 5;

/** A run-level group must be backed by more than one session so a single session
 *  cannot drive the verdict — this is the exact flaw in the legacy
 *  WheeliePatternAnalysis component, whose only gate was `sessionsWithData.length > 0`. */
const MIN_GROUP_SESSION_COUNT = 2;

/** Reuses the MIN_DIFFERENCE_PCT convention from contextualPatterns.ts (percentage
 *  gap, not the legacy component's fixed ±10ms absolute threshold, which does not
 *  scale across riders or reaction-time baselines). */
const MIN_DIFFERENCE_PCT = 5;

function isValidReaction(value: number | null): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

interface GroupStats {
	runCount: number;
	sessionCount: number;
	averageReactionMs: number | null;
}

function groupStats(runs: WheelieRunLike[]): GroupStats {
	const sessionIds = new Set(runs.map((run) => run.session_id));
	const total = runs.reduce((sum, run) => sum + (run.reaction_time_ms as number), 0);
	return {
		runCount: runs.length,
		sessionCount: sessionIds.size,
		averageReactionMs: runs.length > 0 ? total / runs.length : null
	};
}

function describe(
	state: WheeliePatternEvidenceState,
	wheelie: GroupStats,
	nonWheelie: GroupStats,
	finding: WheeliePatternEvidenceModel['finding']
): WheeliePatternEvidenceModel['presentation'] {
	if (state === 'absent') {
		return {
			label: 'Not enough data',
			statement: `Wheelie-vs-standard-start reaction comparison needs at least ${MIN_GROUP_RUN_COUNT} valid runs across at least ${MIN_GROUP_SESSION_COUNT} sessions on both sides. Currently ${wheelie.runCount} wheelie run${wheelie.runCount === 1 ? '' : 's'} across ${wheelie.sessionCount} session${wheelie.sessionCount === 1 ? '' : 's'} and ${nonWheelie.runCount} standard-start run${nonWheelie.runCount === 1 ? '' : 's'} across ${nonWheelie.sessionCount} session${nonWheelie.sessionCount === 1 ? '' : 's'}.`
		};
	}

	if (state === 'no-pattern') {
		return {
			label: 'No meaningful pattern',
			statement: `Both wheelie and standard starts have enough validated evidence, but reaction time does not differ meaningfully between them. This is below the ${MIN_DIFFERENCE_PCT}% pattern threshold.`
		};
	}

	const direction = finding!.direction === 'wheelie-faster' ? 'faster' : 'slower';
	return {
		label: 'Contextual finding',
		statement: `Wheelie starts are ${Math.abs(finding!.differencePercent).toFixed(1)}% ${direction} than standard starts on average (${(finding!.wheelieAverageReactionMs / 1000).toFixed(3)}s vs ${(finding!.nonWheelieAverageReactionMs / 1000).toFixed(3)}s) across ${wheelie.runCount} wheelie and ${nonWheelie.runCount} standard-start validated runs. This is an association, not a cause.`
	};
}

/**
 * Wheelie-pattern evidence boundary for /progress-next.
 *
 * A two-group categorical comparison (wheelie starts vs. standard starts),
 * architecturally matching reactionContextEvidence.ts's 'absent' | 'no-pattern'
 * | 'contextual-finding' family rather than a cross-session trend model. Runs
 * are only eligible when analytics_valid is explicitly true and front_wheel_lifted
 * is explicitly true or false — unmeasured (null/undefined) values enter neither
 * group, and invalid readings enter neither group. Both groups must
 * independently clear a run-count and session-diversity floor before any claim
 * is made, so a single session's run volume can never drive the verdict.
 */
export function buildWheeliePatternEvidence(runs: WheelieRunLike[]): WheeliePatternEvidenceModel {
	const eligible = runs.filter(
		(run) =>
			run.analytics_valid === true &&
			isValidReaction(run.reaction_time_ms) &&
			(run.front_wheel_lifted === true || run.front_wheel_lifted === false)
	);

	const wheelieRuns = eligible.filter((run) => run.front_wheel_lifted === true);
	const nonWheelieRuns = eligible.filter((run) => run.front_wheel_lifted === false);

	const wheelie = groupStats(wheelieRuns);
	const nonWheelie = groupStats(nonWheelieRuns);

	const hasEnoughSupport =
		wheelie.runCount >= MIN_GROUP_RUN_COUNT &&
		wheelie.sessionCount >= MIN_GROUP_SESSION_COUNT &&
		nonWheelie.runCount >= MIN_GROUP_RUN_COUNT &&
		nonWheelie.sessionCount >= MIN_GROUP_SESSION_COUNT;

	if (!hasEnoughSupport) {
		return {
			state: 'absent',
			wheelieRunCount: wheelie.runCount,
			wheelieSessionCount: wheelie.sessionCount,
			nonWheelieRunCount: nonWheelie.runCount,
			nonWheelieSessionCount: nonWheelie.sessionCount,
			finding: null,
			presentation: describe('absent', wheelie, nonWheelie, null)
		};
	}

	const wheelieAvg = wheelie.averageReactionMs as number;
	const nonWheelieAvg = nonWheelie.averageReactionMs as number;
	const differenceMs = wheelieAvg - nonWheelieAvg;
	const differencePercent = (differenceMs / nonWheelieAvg) * 100;

	if (Math.abs(differencePercent) < MIN_DIFFERENCE_PCT) {
		return {
			state: 'no-pattern',
			wheelieRunCount: wheelie.runCount,
			wheelieSessionCount: wheelie.sessionCount,
			nonWheelieRunCount: nonWheelie.runCount,
			nonWheelieSessionCount: nonWheelie.sessionCount,
			finding: null,
			presentation: describe('no-pattern', wheelie, nonWheelie, null)
		};
	}

	const finding: WheeliePatternEvidenceModel['finding'] = {
		direction: differenceMs < 0 ? 'wheelie-faster' : 'wheelie-slower',
		wheelieAverageReactionMs: wheelieAvg,
		nonWheelieAverageReactionMs: nonWheelieAvg,
		differenceMs,
		differencePercent
	};

	return {
		state: 'contextual-finding',
		wheelieRunCount: wheelie.runCount,
		wheelieSessionCount: wheelie.sessionCount,
		nonWheelieRunCount: nonWheelie.runCount,
		nonWheelieSessionCount: nonWheelie.sessionCount,
		finding,
		presentation: describe('contextual-finding', wheelie, nonWheelie, finding)
	};
}

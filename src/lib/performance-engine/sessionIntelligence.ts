/**
 * Session Intelligence Engine
 *
 * Pure computation — takes run data and returns quantitative analysis.
 * No headlines, no recommendations, no coaching language.
 *
 * Those belong to sessionNarrative.ts, which accepts a SessionIntelligenceReport
 * as input and produces the single unified coaching output.
 *
 * v8.5: Removed buildHeadline() and buildRecommendations(). Removed `headline`
 * and `recommendations` from SessionIntelligenceReport. The report is now
 * strictly a computation result — interpretation is sessionNarrative's job.
 */

import { analyseRepeatability, type RunData, type RepeatabilityAnalysis } from './repeatability';
import { analyseFatigue, type FatigueAnalysis } from './fatigue';
import { analyseBestVsAverage, type BestVsAverageAnalysis } from './bestVsAverage';
import { detectDropOff, type DropOffAnalysis } from './dropoff';
import { suggestSetLength, type SetLengthSuggestion } from './setLength';

export interface SessionIntelligenceReport {
	repeatability: RepeatabilityAnalysis;
	fatigue: FatigueAnalysis;
	bestVsAvg: BestVsAverageAnalysis | null;
	dropOff: DropOffAnalysis | null;
	setLength: SetLengthSuggestion;
	sessionQuality: number;
}

export function analyseSessionIntelligence(runs: RunData[]): SessionIntelligenceReport {
	const repeat = analyseRepeatability(runs);
	const speeds = runs
		.map((r) => r.peakSpeed)
		.filter((v): v is number => typeof v === 'number' && !isNaN(v));

	// Fatigue uses peak speed as the primary signal (higher = better, so a
	// declining second half flags fatigue). When speed is unavailable for the
	// whole session — e.g. calibration blocked — fall back to reaction time.
	// Reaction time is directly measured, so it is trustworthy even when
	// speed/power are blocked. For reaction time, lower is better, so we negate
	// the values before passing them to analyseFatigue (which treats higher = better).
	let fatigue: FatigueAnalysis;
	if (speeds.length >= 4) {
		fatigue = analyseFatigue(speeds);
	} else {
		const reactions = runs
			.map((r) => r.reactionTime)
			.filter((v): v is number => typeof v === 'number' && !isNaN(v));
		fatigue = reactions.length >= 4 ? analyseFatigue(reactions.map((v) => -v)) : analyseFatigue([]);
	}

	// bestVsAvg and dropOff operate on the filtered speeds array (only runs with
	// a valid speed value). If calibration is poor and some runs return null
	// speed, those runs are silently excluded from the calculation. This is
	// intentional — comparing valid and invalid speeds would produce meaningless
	// gap percentages — but it means bestVsAvg reflects only the analytics-valid
	// subset, not the full session. The caller should treat these results as
	// conditional on speeds.length / runs.length when presenting to the user.
	const bestVsAvg = analyseBestVsAverage(speeds);
	const dropOff = detectDropOff(speeds);
	const setLength = suggestSetLength(dropOff, runs.length);
	const quality = repeat.overall - (fatigue.trend === 'declining' ? 20 : 0);

	return {
		repeatability: repeat,
		fatigue,
		bestVsAvg,
		dropOff,
		setLength,
		sessionQuality: Math.max(0, quality)
	};
}

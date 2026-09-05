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

export interface PerformancePersistenceEvidence {
	physicalRunCount: number;
	supportedRunCount: number;
	supportedRunNumbers: number[];
	coverage: 'complete' | 'incomplete-contiguous' | 'incomplete-non-contiguous';
	dropOffRun: number | null;
	demonstratedThroughRun: number | null;
}

export interface SessionIntelligenceReport {
	repeatability: RepeatabilityAnalysis;
	fatigue: FatigueAnalysis;
	bestVsAvg: BestVsAverageAnalysis | null;
	dropOff: DropOffAnalysis | null;
	setLength: SetLengthSuggestion;
	performancePersistence: PerformancePersistenceEvidence;
	sessionQuality: number;
}

export interface SessionIntelligenceOptions {
	physicalRunCount?: number;
}

export function analyseSessionIntelligence(
	runs: RunData[],
	options: SessionIntelligenceOptions = {}
): SessionIntelligenceReport {
	const repeat = analyseRepeatability(runs);
	const speedObservations = runs
		.map((r, index) => ({
			runNumber: r.runNumber ?? index + 1,
			value: r.peakSpeed
		}))
		.filter(
			(observation): observation is { runNumber: number; value: number } =>
				typeof observation.value === 'number' && !isNaN(observation.value)
		);
	const speeds = speedObservations.map((observation) => observation.value);
	const supportedRunNumbers = speedObservations.map((observation) => observation.runNumber);
	const physicalRunCount = options.physicalRunCount ?? runs.length;
	const contiguousFromStart = supportedRunNumbers.every(
		(runNumber, index) => runNumber === index + 1
	);
	const coverage: PerformancePersistenceEvidence['coverage'] =
		supportedRunNumbers.length === physicalRunCount && contiguousFromStart
			? 'complete'
			: contiguousFromStart
				? 'incomplete-contiguous'
				: 'incomplete-non-contiguous';

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

	// bestVsAvg and dropOff operate on valid speed observations only. bestVsAvg
	// needs only the numeric values; dropOff also receives preserved physical run
	// numbers so a "Run N" result cannot become a filtered-array position.
	const bestVsAvg = analyseBestVsAverage(speeds);
	const dropOff = detectDropOff(speeds, supportedRunNumbers);
	const setLength = suggestSetLength(dropOff, runs.length);
	const demonstratedThroughRun =
		coverage === 'incomplete-non-contiguous'
			? null
			: dropOff
				? dropOff.dropOffRun - 1
				: (supportedRunNumbers.at(-1) ?? null);
	const performancePersistence: PerformancePersistenceEvidence = {
		physicalRunCount,
		supportedRunCount: supportedRunNumbers.length,
		supportedRunNumbers,
		coverage,
		dropOffRun: dropOff?.dropOffRun ?? null,
		demonstratedThroughRun
	};
	const quality = repeat.overall - (fatigue.trend === 'declining' ? 20 : 0);

	return {
		repeatability: repeat,
		fatigue,
		bestVsAvg,
		dropOff,
		setLength,
		performancePersistence,
		sessionQuality: Math.max(0, quality)
	};
}

/**
 * Performance Engine v8.0 — Cross-Session Intelligence
 *
 * Main API for analyzing trends across multiple sessions
 */

import { sortByDate, getConfidence } from './trendUtils';
import { analysePerformanceProgression } from './progressionAnalysis';
import { analyseConsistencyTrends } from './consistencyTrends';
import { analyseFatigueProgression } from './fatigueProgression';
import { analyseContextualPatterns } from './contextualPatterns';
import type {
	SessionPerformanceSummary,
	CrossSessionReport,
	CrossSessionOptions,
	OverallTrend,
	PerformanceProgression,
	ConsistencyTrends,
	FatigueProgression
} from './types';

const DEFAULT_OPTIONS: Required<CrossSessionOptions> = {
	minSessions: 3,
	lookbackSessions: 5
};

export function analyseCrossSessionIntelligence(
	sessions: SessionPerformanceSummary[],
	options: CrossSessionOptions = {}
): CrossSessionReport {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Insufficient data check
	if (sessions.length < opts.minSessions) {
		return {
			status: 'insufficient-data',
			sessionCount: sessions.length,
			lookbackSessions: 0,
			confidence: 'low',
			overallTrend: 'unknown',
			performance: {
				speedTrend: createEmptyTrend(),
				reactionTrend: createEmptyTrend(),
				peakGTrend: createEmptyTrend()
			},
			consistency: {
				repeatabilityTrend: createEmptyTrend(),
				bestVsAverageGapTrend: createEmptyTrend()
			},
			fatigue: {
				dropOffTrend: createEmptyTrend(),
				optimalSetLengthTrend: createEmptyTrend()
			},
			contextualPatterns: null,
			warnings: [`Need at least ${opts.minSessions} sessions for trend analysis`],
			recommendations: [],
			headline: 'Insufficient data for cross-session analysis'
		};
	}

	// Sort and limit to lookback window
	const sortedSessions = sortByDate(sessions);
	const lookbackSessions = sortedSessions.slice(-opts.lookbackSessions);
	const confidence = getConfidence(lookbackSessions.length);

	// Perform analyses
	const performance = analysePerformanceProgression(lookbackSessions);
	const consistency = analyseConsistencyTrends(lookbackSessions);
	const fatigue = analyseFatigueProgression(lookbackSessions);

	// Contextual pattern analysis uses the full session history (not just lookback)
	// so condition groups have the best chance of reaching the minimum sample threshold.
	const contextualPatterns = analyseContextualPatterns(sortedSessions);

	// Determine overall trend
	const overallTrend = determineOverallTrend(performance, consistency, fatigue);

	// Generate warnings
	const warnings = generateWarnings(performance, consistency, fatigue);

	// Generate recommendations
	const recommendations = generateRecommendations(performance, consistency, fatigue, overallTrend);

	// Generate headline
	const headline = generateHeadline(overallTrend, performance, consistency, fatigue);

	return {
		status: 'ready',
		sessionCount: sessions.length,
		lookbackSessions: lookbackSessions.length,
		confidence,
		overallTrend,
		performance,
		consistency,
		fatigue,
		contextualPatterns: contextualPatterns.hasEnoughData ? contextualPatterns : null,
		warnings,
		recommendations,
		headline
	};
}

function createEmptyTrend() {
	return {
		direction: 'unknown' as const,
		change: null,
		changePercent: null,
		recent: null,
		historical: null,
		improving: false
	};
}

function determineOverallTrend(
	performance: PerformanceProgression,
	consistency: ConsistencyTrends,
	fatigue: FatigueProgression
): OverallTrend {
	const improvingCount = [
		performance.speedTrend.improving,
		performance.reactionTrend.improving,
		consistency.repeatabilityTrend.improving,
		fatigue.optimalSetLengthTrend.improving
	].filter(Boolean).length;

	const decliningCount = [
		performance.speedTrend.improving === false && performance.speedTrend.direction !== 'stable',
		performance.reactionTrend.improving === false &&
			performance.reactionTrend.direction !== 'stable',
		consistency.repeatabilityTrend.improving === false &&
			consistency.repeatabilityTrend.direction !== 'stable',
		fatigue.optimalSetLengthTrend.improving === false &&
			fatigue.optimalSetLengthTrend.direction !== 'stable'
	].filter(Boolean).length;

	if (improvingCount >= 3) return 'improving';
	if (decliningCount >= 3) return 'declining';
	if (improvingCount >= 2 && decliningCount === 0) return 'improving';
	if (decliningCount >= 2 && improvingCount === 0) return 'declining';
	if (improvingCount === decliningCount && improvingCount > 0) return 'mixed';

	return 'stable';
}

function generateWarnings(
	performance: PerformanceProgression,
	consistency: ConsistencyTrends,
	fatigue: FatigueProgression
): string[] {
	const warnings: string[] = [];

	// Trade-off detection: speed up but consistency down
	if (performance.speedTrend.improving && !consistency.repeatabilityTrend.improving) {
		warnings.push('Peak speed improving but repeatability declining');
	}

	// Speed up but capacity down
	if (performance.speedTrend.improving && !fatigue.optimalSetLengthTrend.improving) {
		warnings.push('Speed improving but set capacity dropping');
	}

	// Reaction trend worsening
	if (performance.reactionTrend.direction === 'up' && !performance.reactionTrend.improving) {
		warnings.push('Reaction times worsening');
	}

	// Best-vs-average gap widening
	if (
		consistency.bestVsAverageGapTrend.direction === 'up' &&
		!consistency.bestVsAverageGapTrend.improving
	) {
		warnings.push('Best-vs-average gap widening');
	}

	// Fatigue appearing earlier
	if (fatigue.dropOffTrend.direction === 'down' && !fatigue.dropOffTrend.improving) {
		warnings.push('Fatigue appearing earlier in sessions');
	}

	return warnings;
}

function generateRecommendations(
	performance: PerformanceProgression,
	consistency: ConsistencyTrends,
	fatigue: FatigueProgression,
	overallTrend: OverallTrend
): string[] {
	const rec: string[] = [];

	if (overallTrend === 'improving') {
		rec.push('Continue current training approach');
	}

	if (overallTrend === 'declining') {
		rec.push('Review training volume and recovery');
	}

	// Specific recommendations based on trends
	if (
		!consistency.repeatabilityTrend.improving &&
		consistency.repeatabilityTrend.direction !== 'stable'
	) {
		rec.push('Focus on repeatability over peak runs');
	}

	if (
		!fatigue.optimalSetLengthTrend.improving &&
		fatigue.optimalSetLengthTrend.direction === 'down'
	) {
		rec.push('Increase recovery between sessions');
	}

	if (performance.speedTrend.improving && consistency.repeatabilityTrend.improving) {
		rec.push('Excellent progress - maintain current approach');
	}

	return rec;
}

function generateHeadline(
	overallTrend: OverallTrend,
	performance: PerformanceProgression,
	consistency: ConsistencyTrends,
	fatigue: FatigueProgression
): string {
	if (overallTrend === 'improving') {
		if (performance.speedTrend.change !== null) {
			return `Performance improving (+${performance.speedTrend.change.toFixed(1)} km/h)`;
		}
		return 'Performance improving across sessions';
	}

	if (overallTrend === 'declining') {
		// Softer language for declines
		return 'Multiple metrics trending down — review training approach';
	}

	if (overallTrend === 'mixed') {
		return 'Mixed progress — some metrics improving, others declining';
	}

	return 'Performance stable across sessions';
}

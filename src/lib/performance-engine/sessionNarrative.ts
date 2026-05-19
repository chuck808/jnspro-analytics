/**
 * v8.3 Session Narrative Builder
 * 
 * Creates consistent coaching messages using controlled language
 */

import type { SessionNarrative, CoachMessage, TrustContext, ConfidenceLevel, Priority } from './language/types';
import { HEADLINES, IMPACTS, WHY_MATTERS, ACTIONS, WATCH_FOR, runCountQualifier } from './language/phrases';

export interface SessionNarrativeInput {
  runCount: number;
  excludedRunCount?: number;
  excludedReasons?: string[];
  sessionFocus?: string | null;
  trackSurface?: string | null;
  consistencyScore?: number | null;
  reactionCvPercent?: number | null;
  dataQualityRating?: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null;
  speedBlocked?: boolean;
  powerBlocked?: boolean;
  hasCalibrationWarnings?: boolean;
  fatigueDetected?: boolean;
  dropOffRun?: number | null;
  bestVsAvgGapPercent?: number | null;
}

/**
 * Build a session narrative from session data
 */
export function buildSessionNarrative(input: SessionNarrativeInput): SessionNarrative {
  const warnings: string[] = [];
  const trustedMetrics: string[] = ['reaction time'];
  const cautionMetrics: string[] = [];
  const blockedMetrics: string[] = [];
  
  // Determine confidence level
  let confidence: ConfidenceLevel = 'moderate';
  if (input.runCount < 3) {
    confidence = 'low';
  } else if (input.runCount >= 8) {
    confidence = 'high';
  }
  
  // Check for blocked metrics
  if (input.speedBlocked || input.dataQualityRating === 'calibrate') {
    blockedMetrics.push('speed');
  }
  if (input.powerBlocked || input.dataQualityRating === 'calibrate') {
    blockedMetrics.push('power');
  }
  
  // Build trust context
  const trust: TrustContext = {
    confidence,
    basedOnRuns: input.runCount,
    excludedRuns: input.excludedRunCount ?? 0,
    excludedReasons: input.excludedReasons ?? [],
    trustedMetrics,
    cautionMetrics,
    blockedMetrics
  };

  // Session context modifiers — applied before the priority chain so they
  // can influence which message fires and what appears in warnings.
  const isTesting = input.sessionFocus === 'testing' || input.sessionFocus === 'technique';

  if (isTesting) {
    warnings.push('Testing or technique session — consistency and repeatability metrics reflect intentional variation, not a baseline problem');
  }

  if (input.trackSurface === 'wet' || input.trackSurface === 'muddy') {
    warnings.push(`Surface was ${input.trackSurface} — speed and traction-dependent metrics should be compared against other ${input.trackSurface} sessions only`);
    cautionMetrics.push('speed', 'explosiveness');
  }
  
  // Determine primary message
  let message: CoachMessage;
  
  // Split calibration issues into major vs minor
  const majorCalibrationIssue =
    input.dataQualityRating === 'calibrate' ||
    blockedMetrics.length >= 2;
  
  const minorCalibrationIssue =
    input.dataQualityRating === 'unknown' ||
    input.dataQualityRating === 'fair' ||
    (blockedMetrics.length === 1 && !majorCalibrationIssue);
  
  // Priority 1: Major calibration issues
  if (majorCalibrationIssue) {
    message = {
      headline: HEADLINES.calibrationLimited,
      impact: IMPACTS.calibrationLimited,
      whyThisMatters: WHY_MATTERS.calibration,
      action: ACTIONS.useTechniqueOnly,
      watchFor: WATCH_FOR.calibrationImprovement,
      confidence,
      priority: 'critical'
    };
    warnings.push('Calibration limited — speed and power metrics unreliable');
  }
  // Priority 1b: Unknown data quality
  else if (input.dataQualityRating === 'unknown') {
    cautionMetrics.push('derived metrics');
    message = {
      headline: 'Data quality unknown — interpret trends with caution',
      impact: 'Some metrics may not be fully reliable due to unknown calibration state.',
      whyThisMatters: WHY_MATTERS.calibration,
      action: 'Use this session for reaction time and technique review. Check sensor placement and calibration.',
      watchFor: WATCH_FOR.calibrationImprovement,
      confidence: 'low',
      priority: 'watch'
    };
    warnings.push('Data quality unknown — exercise caution with derived metrics');
  }
  // Priority 2: Low run count
  else if (input.runCount < 3) {
    message = {
      headline: HEADLINES.lowRunCount,
      impact: IMPACTS.fewRuns,
      whyThisMatters: WHY_MATTERS.earlyData,
      action: ACTIONS.keepLogging,
      watchFor: WATCH_FOR.trendConfirmation,
      confidence,
      priority: 'info'
    };
  }
  // Priority 3: Fatigue detected
  else if (input.fatigueDetected && input.dropOffRun) {
    message = {
      headline: HEADLINES.fatigue,
      impact: IMPACTS.fatigueDetected,
      whyThisMatters: WHY_MATTERS.fatigue,
      action: ACTIONS.addressFatigue,
      watchFor: WATCH_FOR.fatiguePattern,
      confidence,
      priority: 'important'
    };
    warnings.push(`Quality dropped at run ${input.dropOffRun}`);
  }
  // Priority 4: Poor consistency (threshold adjusted to 12%)
  else if (input.reactionCvPercent && input.reactionCvPercent > 12) {
    // Validate with consistency score if available
    const confirmedLowConsistency = input.consistencyScore !== undefined && input.consistencyScore !== null
      ? (input.reactionCvPercent > 12 && input.consistencyScore < 60)
      : input.reactionCvPercent > 12;
    
    if (confirmedLowConsistency) {
      message = {
        headline: HEADLINES.variableConsistency,
        impact: IMPACTS.consistencyLow,
        whyThisMatters: WHY_MATTERS.consistency,
        action: ACTIONS.reviewTechnique,
        watchFor: WATCH_FOR.consistencyImprovement,
        confidence,
        priority: 'watch'
      };
    } else {
      // Moderate consistency (5-12% CV)
      message = {
        headline: HEADLINES.goodConsistency,
        impact: IMPACTS.consistencyHigh,
        whyThisMatters: WHY_MATTERS.consistency,
        action: ACTIONS.focusOnConsistency,
        watchFor: WATCH_FOR.consistencyImprovement,
        confidence,
        priority: 'info'
      };
    }
  }
  // Priority 5: Wide best-vs-avg gap
  else if (input.bestVsAvgGapPercent && input.bestVsAvgGapPercent > 15) {
    message = {
      headline: HEADLINES.peaksWithoutRepeatability,
      impact: IMPACTS.gapWide,
      whyThisMatters: WHY_MATTERS.repeatability,
      action: ACTIONS.investigateVariation,
      watchFor: WATCH_FOR.consistencyImprovement,
      confidence,
      priority: 'watch'
    };
  }
  // Priority 6: Excellent consistency
  else if (input.reactionCvPercent && input.reactionCvPercent < 5) {
    message = {
      headline: HEADLINES.excellentConsistency,
      impact: IMPACTS.consistencyHigh,
      whyThisMatters: WHY_MATTERS.consistency,
      action: ACTIONS.maintainQuality,
      watchFor: null,
      confidence,
      priority: 'info'
    };
  }
  // Default: Good consistency (5-12% CV range)
  else {
    message = {
      headline: HEADLINES.goodConsistency,
      impact: IMPACTS.consistencyHigh,
      whyThisMatters: WHY_MATTERS.consistency,
      action: ACTIONS.focusOnConsistency,
      watchFor: WATCH_FOR.consistencyImprovement,
      confidence,
      priority: 'info'
    };
    
    // Add caution overlay for minor calibration issues
    if (minorCalibrationIssue) {
      cautionMetrics.push('speed', 'power');
      warnings.push('Minor calibration concern — use trends, not absolute values');
    }
  }
  
  return {
    message,
    trust,
    warnings
  };
}
/**
 * v8.4 Session Narrative Builder
 *
 * Produces a contextual coaching narrative from session data.
 *
 * What changed in v8.4:
 *   - sessionFocus, trackSurface, weatherCondition, rideFeel are now first-class
 *     inputs — not ignored fields. Each modulates the output.
 *   - rideFeel dissonance detection: when the rider's subjective feel and the
 *     objective data disagree, the narrative says so explicitly.
 *   - Focus alignment: when the declared session focus maps to a strong or weak
 *     performance area, the narrative connects them.
 *   - Correlation hints: when the analytics engine has established a pattern
 *     (e.g. "dry concrete → better reaction times"), today's session is
 *     connected to that pattern if conditions match.
 *   - All context notes are appended as a second paragraph — the primary
 *     message (data quality, fatigue, consistency) is unaffected.
 */

import type { SessionNarrative, CoachMessage, TrustContext, ConfidenceLevel } from './language/types';
import {
  HEADLINES, IMPACTS, WHY_MATTERS, ACTIONS, WATCH_FOR,
  buildRideFeelNote, buildFocusAlignmentNote, buildConditionsNote,
  buildCorrelationNote, consistencyBand,
  type RideFeel, type SessionFocus, type TrackSurface,
  type WeatherCondition, type PerformanceArea, type CorrelationHint,
} from './language/phrases';

export interface SessionNarrativeInput {
  // ── Core performance data ─────────────────────────────────────────────────
  runCount:               number;
  excludedRunCount?:      number;
  excludedReasons?:       string[];
  consistencyScore?:      number | null;
  reactionCvPercent?:     number | null;
  dataQualityRating?:     'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null;
  speedBlocked?:          boolean;
  powerBlocked?:          boolean;
  hasCalibrationWarnings?: boolean;
  fatigueDetected?:       boolean;
  dropOffRun?:            number | null;
  bestVsAvgGapPercent?:   number | null;

  // ── Technique scores (0-100) for focus alignment ─────────────────────────
  // Optional — narrative degrades gracefully when absent
  techniqueScores?: {
    launchQuality?:  number | null;
    explosiveness?:  number | null;
    speedCarry?:     number | null;
    smoothness?:     number | null;
    repeatability?:  number | null;
  } | null;

  // ── Session context ───────────────────────────────────────────────────────
  sessionFocus?:      SessionFocus | string | null;
  trackSurface?:      TrackSurface | string | null;
  weatherCondition?:  WeatherCondition | string | null;
  rideFeel?:          RideFeel | string | null;

  // ── Correlation hints from analytics engine ───────────────────────────────
  // Passed when the analytics page has established patterns across sessions.
  // Empty array or absent = no correlation note generated.
  correlationHints?:  CorrelationHint[];
}

/**
 * Build a session narrative from session data and context.
 */
export function buildSessionNarrative(input: SessionNarrativeInput): SessionNarrative {
  const warnings:        string[] = [];
  const trustedMetrics:  string[] = ['reaction time'];
  const cautionMetrics:  string[] = [];
  const blockedMetrics:  string[] = [];

  // ── Confidence from run count ─────────────────────────────────────────────
  let confidence: ConfidenceLevel = 'moderate';
  if (input.runCount < 3)  confidence = 'low';
  if (input.runCount >= 8) confidence = 'high';

  // ── Blocked metrics ───────────────────────────────────────────────────────
  if (input.speedBlocked  || input.dataQualityRating === 'calibrate') blockedMetrics.push('speed');
  if (input.powerBlocked  || input.dataQualityRating === 'calibrate') blockedMetrics.push('power');

  // ── Trust context ─────────────────────────────────────────────────────────
  const trust: TrustContext = {
    confidence,
    basedOnRuns:     input.runCount,
    excludedRuns:    input.excludedRunCount ?? 0,
    excludedReasons: input.excludedReasons ?? [],
    trustedMetrics,
    cautionMetrics,
    blockedMetrics,
  };

  // ── Calibration flags ─────────────────────────────────────────────────────
  const majorCalibrationIssue =
    input.dataQualityRating === 'calibrate' ||
    blockedMetrics.length >= 2;

  // 'unknown' is excluded here — it has its own priority branch (1b) above,
  // so by the time we reach the default else, dataQualityRating cannot be
  // 'unknown'. Including it here would make the flag unreachable on that path.
  const minorCalibrationIssue =
    input.dataQualityRating === 'fair' ||
    (blockedMetrics.length === 1 && !majorCalibrationIssue);

  // ── Context flags ─────────────────────────────────────────────────────────
  const isTesting = input.sessionFocus === 'testing' || input.sessionFocus === 'technique';

  if (isTesting) {
    warnings.push('Testing or technique session — consistency and repeatability metrics reflect intentional variation, not a baseline problem');
  }

  if (input.trackSurface === 'wet' || input.trackSurface === 'muddy') {
    warnings.push(`Surface was ${input.trackSurface} — speed and traction-dependent metrics should be compared against other ${input.trackSurface} sessions only`);
    cautionMetrics.push('speed', 'explosiveness');
  }

  // ── Primary message (priority chain — unchanged from v8.3) ───────────────

  let message: CoachMessage;

  // Priority 1: Major calibration issues
  if (majorCalibrationIssue) {
    message = {
      headline:           HEADLINES.calibrationLimited,
      impact:             IMPACTS.calibrationLimited,
      whyThisMatters:     WHY_MATTERS.calibration,
      action:             ACTIONS.useTechniqueOnly,
      watchFor:           WATCH_FOR.calibrationImprovement,
      confidence,
      priority:           'critical',
      isCoachingHeadline: true,
    };
    warnings.push('Calibration limited — speed and power metrics unreliable');
  }
  // Priority 1b: Unknown data quality
  else if (input.dataQualityRating === 'unknown') {
    cautionMetrics.push('derived metrics');
    message = {
      headline:           'Data quality unknown — interpret trends with caution',
      impact:             'Some metrics may not be fully reliable due to unknown calibration state.',
      whyThisMatters:     WHY_MATTERS.calibration,
      action:             'Use this session for reaction time and technique review. Check sensor placement and calibration.',
      watchFor:           WATCH_FOR.calibrationImprovement,
      confidence:         'low',
      priority:           'watch',
      isCoachingHeadline: true,
    };
    warnings.push('Data quality unknown — exercise caution with derived metrics');
  }
  // Priority 2: Low run count
  else if (input.runCount < 3) {
    message = {
      headline:           HEADLINES.lowRunCount,
      impact:             IMPACTS.fewRuns,
      whyThisMatters:     WHY_MATTERS.earlyData,
      action:             ACTIONS.keepLogging,
      watchFor:           WATCH_FOR.trendConfirmation,
      confidence,
      priority:           'info',
      isCoachingHeadline: true,
    };
  }
  // Priority 3: Fatigue detected
  else if (input.fatigueDetected && input.dropOffRun) {
    message = {
      headline:           HEADLINES.fatigue,
      impact:             IMPACTS.fatigueDetected,
      whyThisMatters:     WHY_MATTERS.fatigue,
      action:             ACTIONS.addressFatigue,
      watchFor:           WATCH_FOR.fatiguePattern,
      confidence,
      priority:           'important',
      isCoachingHeadline: true,
    };
    warnings.push(`Quality dropped at run ${input.dropOffRun}`);
  }
  // Priority 4: Poor consistency
  // CV threshold of 12% is the trigger, but requires confirmation from
  // consistencyScore < 60 when that field is available. The 12% figure was
  // chosen after the original 5% threshold proved too sensitive — at 5% the
  // warning fired on nearly every normal session. 12% CV on reaction time
  // represents roughly ±1.5–2 stdDev spread above what a well-trained rider
  // produces in a calm, focused set. The dual-condition guard (CV > 12 AND
  // score < 60) prevents the warning firing on sessions where the engine
  // already disagrees about consistency quality.
  else if (input.reactionCvPercent && input.reactionCvPercent > 12) {
    const confirmedLowConsistency =
      input.consistencyScore !== undefined && input.consistencyScore !== null
        ? (input.reactionCvPercent > 12 && input.consistencyScore < 60)
        : input.reactionCvPercent > 12;

    if (confirmedLowConsistency) {
      message = {
        headline:           HEADLINES.variableConsistency,
        impact:             IMPACTS.consistencyLow,
        whyThisMatters:     WHY_MATTERS.consistency,
        action:             ACTIONS.reviewTechnique,
        watchFor:           WATCH_FOR.consistencyImprovement,
        confidence,
        priority:           'watch',
        isCoachingHeadline: true,
      };
    } else {
      message = {
        headline:           HEADLINES.goodConsistency,
        impact:             IMPACTS.consistencyHigh,
        whyThisMatters:     WHY_MATTERS.consistency,
        action:             ACTIONS.focusOnConsistency,
        watchFor:           WATCH_FOR.consistencyImprovement,
        confidence,
        priority:           'info',
        isCoachingHeadline: true,
      };
    }
  }
  // Priority 5: Wide best-vs-avg gap
  else if (input.bestVsAvgGapPercent && input.bestVsAvgGapPercent > 15) {
    message = {
      headline:           HEADLINES.peaksWithoutRepeatability,
      impact:             IMPACTS.gapWide,
      whyThisMatters:     WHY_MATTERS.repeatability,
      action:             ACTIONS.investigateVariation,
      watchFor:           WATCH_FOR.consistencyImprovement,
      confidence,
      priority:           'watch',
      isCoachingHeadline: true,
    };
  }
  // Priority 6: Excellent consistency
  else if (input.reactionCvPercent && input.reactionCvPercent < 5) {
    message = {
      headline:           HEADLINES.excellentConsistency,
      impact:             IMPACTS.consistencyHigh,
      whyThisMatters:     WHY_MATTERS.consistency,
      action:             ACTIONS.maintainQuality,
      watchFor:           null,
      confidence,
      priority:           'info',
      isCoachingHeadline: true,
    };
  }
  // Default: Good consistency (5-12% CV range)
  else {
    message = {
      headline:           HEADLINES.goodConsistency,
      impact:             IMPACTS.consistencyHigh,
      whyThisMatters:     WHY_MATTERS.consistency,
      action:             ACTIONS.focusOnConsistency,
      watchFor:           WATCH_FOR.consistencyImprovement,
      confidence,
      priority:           'info',
      isCoachingHeadline: true,
    };

    if (minorCalibrationIssue) {
      cautionMetrics.push('speed', 'power');
      warnings.push('Minor calibration concern — use trends, not absolute values');
    }
  }

  // ── Context notes (v8.4) ──────────────────────────────────────────────────
  //
  // These are assembled independently of the primary message priority chain
  // and stored on the narrative so the UI can render them as a second
  // paragraph. They do not override the primary message — they add to it.
  //
  // Order: rideFeel dissonance → focus alignment → conditions → correlation

  const contextNotes: string[] = [];

  // 1. RideFeel dissonance
  if (input.rideFeel) {
    const band = consistencyBand(input.consistencyScore);
    const feelNote = buildRideFeelNote({
      feel:            input.rideFeel as RideFeel,
      consistency:     band,
      fatigueDetected: input.fatigueDetected ?? false,
    });
    if (feelNote) contextNotes.push(feelNote);
  }

  // 2. Session focus alignment (only when technique scores are available)
  if (input.sessionFocus && input.techniqueScores) {
    const scores = input.techniqueScores;
    const strongAreas: PerformanceArea[] = [];
    const weakAreas:   PerformanceArea[] = [];

    const scoreMap: [PerformanceArea, number | null | undefined][] = [
      ['reaction',      scores.launchQuality],
      ['explosiveness', scores.explosiveness],
      ['speedCarry',    scores.speedCarry],
      ['smoothness',    scores.smoothness],
      ['consistency',   scores.repeatability],
    ];

    for (const [area, score] of scoreMap) {
      if (typeof score === 'number') {
        if (score >= 75) strongAreas.push(area);
        if (score < 60)  weakAreas.push(area);
      }
    }

    const focusNote = buildFocusAlignmentNote({
      focus:       input.sessionFocus as SessionFocus,
      strongAreas,
      weakAreas,
      isTesting,
    });
    if (focusNote && !contextNotes.some(n => n.includes('testing session'))) {
      contextNotes.push(focusNote);
    }
  }

  // 3. Conditions note (only for non-neutral conditions)
  const conditionsNote = buildConditionsNote(
    input.trackSurface as TrackSurface | null,
    input.weatherCondition as WeatherCondition | null
  );
  // Avoid duplicate if already in warnings
  if (conditionsNote && !warnings.some(w => w.includes(input.trackSurface ?? ''))) {
    contextNotes.push(conditionsNote);
  }

  // 4. Correlation hint (only when hints are provided and strong enough)
  if (input.correlationHints && input.correlationHints.length > 0) {
    const correlationNote = buildCorrelationNote(
      input.correlationHints,
      input.trackSurface ?? null,
      input.weatherCondition ?? null
    );
    if (correlationNote) contextNotes.push(correlationNote);
  }

  return {
    message,
    trust,
    warnings,
    contextNotes,
  };
}
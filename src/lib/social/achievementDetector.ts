/**
 * Social Layer — Achievement Detector v2
 *
 * Rebuilt from the Shareable Insights Specification.
 *
 * The governing question:
 *   "Did this rider produce something worth acknowledging, given who they are,
 *    what they set out to do, what surrounded them, and what the data showed?"
 *
 * Detection flow:
 *   1. Hard suppression gate — exit immediately if session can't be trusted
 *   2. Candidate generation — evaluate all nine trigger categories
 *   3. Rank by priority score
 *   4. Build the winning achievement — session story + triggering metric + conditions badge
 *   5. Return result with full candidate list for debugging
 */

import type {
  AchievementDetectorInput,
  AchievementDetectionResult,
  ShareableAchievement,
  AchievementType,
  AchievementScope,
  AchievementMetric,
  ConditionsBadge,
  SupportingContext,
  CardTemplate,
  SensitivityLevel,
  SuppressionReason,
} from './types';

// ── Priority scores ────────────────────────────────────────────────────────────
// Higher = wins when multiple triggers fire.

const SCORES: Record<AchievementType, number> = {
  'pb':              100,
  'milestone':        95,
  'condition-pb':     80,
  'focus-alignment':  75,
  'session-quality':  65,
  'consistency':      60,
  'resilience':       55,
  'goal-progress':    50,
  'engine-strength':  45,
  'progression':      40,
  'solid-session':    10,
};

// ── Thresholds ────────────────────────────────────────────────────────────────

const MIN_STAT_RUNS             = 3;
const MIN_CONDITION_SESSIONS    = 3;
const MIN_LONGITUDINAL_SESSIONS = 5;
const MIN_PROGRESSION_PCT       = 3;
const CV_EXCELLENT              = 5;
const CV_GOOD                   = 8;
const QUALITY_HIGH              = 75;
const QUALITY_MODERATE          = 60;
const REPEATABILITY_HIGH        = 80;
const REPEATABILITY_MODERATE    = 65;
const TECHNIQUE_GOOD            = 70;
const BEST_VS_AVG_TIGHT         = 5;
const RESILIENCE_WITHIN_PCT     = 8;

// ── Main entry point ──────────────────────────────────────────────────────────

export function detectAchievement(
  input: AchievementDetectorInput
): AchievementDetectionResult {

  // Step 1: Hard suppression
  const suppressionReason = checkHardSuppression(input);
  if (suppressionReason) {
    return { achievement: null, candidates: [], suppressionReason };
  }

  // Step 2: Generate all candidates
  const candidates = [
    tryPB(input),
    tryMilestone(input),
    tryConditionPB(input),
    tryFocusAlignment(input),
    trySessionQuality(input),
    tryConsistency(input),
    tryResilience(input),
    tryGoalProgress(input),
    tryEngineStrength(input),
    tryProgression(input),
    trySolidSession(input),
  ];

  // Step 3: Rank
  const viable = candidates
    .filter(c => !c.suppressed && c.buildAchievement)
    .sort((a, b) => b.score - a.score);

  if (viable.length === 0) {
    return {
      achievement: null,
      candidates: candidates.map(toSummary),
      suppressionReason: 'no-meaningful-event',
    };
  }

  // Step 4: Build the winning achievement
  const winner = viable[0];
  const achievement = winner.buildAchievement!(input);

  return {
    achievement,
    candidates: candidates.map(toSummary),
    suppressionReason: null,
  };
}

// ── Hard suppression ──────────────────────────────────────────────────────────

function checkHardSuppression(input: AchievementDetectorInput): SuppressionReason | null {
  const focus = input.context.sessionFocus;

  if (focus === 'testing' || focus === 'technique') return 'testing-session';
  if (focus === 'recovery') return 'recovery-session';
  if (input.dataQualityRating === 'calibrate') return 'invalid-telemetry';
  if (input.sessionStats.included_run_count < MIN_STAT_RUNS) return 'incomplete-session';

  return null;
}

// ── Candidate structure ───────────────────────────────────────────────────────

interface Candidate {
  type: AchievementType;
  scope: AchievementScope;
  suppressed: boolean;
  suppressionReason?: SuppressionReason;
  score: number;
  buildAchievement?: (input: AchievementDetectorInput) => ShareableAchievement;
}

function miss(
  type: AchievementType,
  scope: AchievementScope,
  reason: SuppressionReason
): Candidate {
  return { type, scope, suppressed: true, suppressionReason: reason, score: 0 };
}

function hit(
  type: AchievementType,
  scope: AchievementScope,
  scoreBonus: number,
  builder: (input: AchievementDetectorInput) => ShareableAchievement
): Candidate {
  return {
    type, scope, suppressed: false,
    score: SCORES[type] + scoreBonus,
    buildAchievement: builder,
  };
}

function toSummary(c: Candidate) {
  return {
    type: c.type,
    scope: c.scope,
    suppressed: c.suppressed,
    suppressionReason: c.suppressionReason,
    score: c.score,
  };
}

// ── Detector functions ────────────────────────────────────────────────────────

function tryPB(input: AchievementDetectorInput): Candidate {
  const { sessionStats, allTimePBs, context } = input;

  // Reaction time PB — highest priority, most meaningful for gate starts
  if (
    sessionStats.best_reaction_ms !== null &&
    allTimePBs.bestReactionMs !== null &&
    sessionStats.best_reaction_ms < allTimePBs.bestReactionMs
  ) {
    const improvePct = ((allTimePBs.bestReactionMs - sessionStats.best_reaction_ms) / allTimePBs.bestReactionMs) * 100;
    const bonus = context.isChallengingConditions ? 5 : 0;

    return hit('pb', 'session', bonus, (inp) => {
      const metric: AchievementMetric = {
        label: 'Reaction Time',
        value: (sessionStats.best_reaction_ms! / 1000).toFixed(3),
        unit: 's',
        rawValue: sessionStats.best_reaction_ms!,
        previousValue: allTimePBs.bestReactionMs!,
        improvementPercent: improvePct,
        improvementDisplay: `${((allTimePBs.bestReactionMs! - sessionStats.best_reaction_ms!) / 1000).toFixed(3)}s faster`,
        context: context.isChallengingConditions ? `on ${formatSurface(context.trackSurface)}` : undefined,
      };

      return buildAchievement(inp, {
        type: 'pb',
        scope: 'session',
        template: 'pb',
        headlineTitle: 'NEW PERSONAL\nBEST',
        headlineSubtitle: 'Fastest reaction time ever recorded',
        metric,
        taglines: buildTaglines('pb', context),
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  // Session quality PB
  if (
    input.intelligence.sessionQuality !== null &&
    allTimePBs.bestSessionQuality !== null &&
    input.intelligence.sessionQuality > allTimePBs.bestSessionQuality
  ) {
    const q = input.intelligence.sessionQuality;
    return hit('pb', 'session', -5, (inp) => {
      const metric: AchievementMetric = {
        label: 'Session Quality',
        value: q.toFixed(0),
        unit: '/100',
        rawValue: q,
        previousValue: allTimePBs.bestSessionQuality!,
        improvementDisplay: `${(q - allTimePBs.bestSessionQuality!).toFixed(0)} points better`,
      };
      return buildAchievement(inp, {
        type: 'pb', scope: 'session', template: 'pb',
        headlineTitle: 'BEST SESSION\nEVER',
        headlineSubtitle: 'Highest quality score on record',
        metric,
        taglines: buildTaglines('pb', context),
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  // Max G PB
  if (
    sessionStats.best_max_g !== null &&
    allTimePBs.bestMaxG !== null &&
    sessionStats.best_max_g > allTimePBs.bestMaxG
  ) {
    const improvePct = ((sessionStats.best_max_g - allTimePBs.bestMaxG) / allTimePBs.bestMaxG) * 100;
    return hit('pb', 'session', -10, (inp) => {
      const metric: AchievementMetric = {
        label: 'Peak G-Force',
        value: sessionStats.best_max_g!.toFixed(2),
        unit: 'G',
        rawValue: sessionStats.best_max_g!,
        previousValue: allTimePBs.bestMaxG!,
        improvementPercent: improvePct,
        improvementDisplay: `+${(sessionStats.best_max_g! - allTimePBs.bestMaxG!).toFixed(2)}G`,
      };
      return buildAchievement(inp, {
        type: 'pb', scope: 'session', template: 'pb',
        headlineTitle: 'NEW PERSONAL\nBEST',
        headlineSubtitle: 'Highest peak G-force on record',
        metric,
        taglines: buildTaglines('pb', context),
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  // Peak speed PB — only when valid
  if (
    sessionStats.has_valid_speed &&
    sessionStats.best_peak_speed_ms !== null &&
    allTimePBs.bestSpeedMs !== null &&
    sessionStats.best_peak_speed_ms > allTimePBs.bestSpeedMs &&
    input.dataQualityRating !== 'unknown'
  ) {
    const currentKmh  = sessionStats.best_peak_speed_ms * 3.6;
    const previousKmh = allTimePBs.bestSpeedMs * 3.6;
    return hit('pb', 'session', -8, (inp) => {
      const metric: AchievementMetric = {
        label: 'Peak Speed',
        value: currentKmh.toFixed(1),
        unit: ' km/h',
        rawValue: sessionStats.best_peak_speed_ms!,
        previousValue: allTimePBs.bestSpeedMs!,
        improvementDisplay: `+${(currentKmh - previousKmh).toFixed(1)} km/h`,
      };
      return buildAchievement(inp, {
        type: 'pb', scope: 'session', template: 'pb',
        headlineTitle: 'NEW PERSONAL\nBEST',
        headlineSubtitle: 'Fastest gate exit speed on record',
        metric,
        taglines: buildTaglines('pb', context),
        confidence: 'moderate', // speed is IMU-estimated
        sensitivity: 'public-safe',
      });
    });
  }

  // Consistency PB (lowest CV% ever)
  if (
    sessionStats.reaction_cv !== null &&
    allTimePBs.bestConsistencyCv !== null &&
    sessionStats.reaction_cv < allTimePBs.bestConsistencyCv
  ) {
    const cv = sessionStats.reaction_cv;
    return hit('pb', 'session', -3, (inp) => {
      const metric: AchievementMetric = {
        label: 'Consistency',
        value: cv.toFixed(1),
        unit: '% variation',
        rawValue: cv,
        previousValue: allTimePBs.bestConsistencyCv!,
        improvementDisplay: `${(allTimePBs.bestConsistencyCv! - cv).toFixed(1)}% more consistent`,
      };
      return buildAchievement(inp, {
        type: 'pb', scope: 'session', template: 'pb',
        headlineTitle: 'MOST CONSISTENT\nEVER',
        headlineSubtitle: 'Tightest gate sequence ever recorded',
        metric,
        taglines: ['Every run.', 'Nearly identical.', "That's control."],
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  return miss('pb', 'session', 'no-meaningful-event');
}

function tryMilestone(input: AchievementDetectorInput): Candidate {
  const significant = input.goalProgress?.find(g => g.isSignificant);
  if (!significant) return miss('milestone', 'session', 'no-meaningful-event');

  const nearTarget = significant.percentToGoal >= 80;
  const bonus = nearTarget ? 5 : 0;

  return hit('milestone', 'session', bonus, (inp) => {
    const rawValue = significant.newValue ?? 0;
    const isReaction = significant.metric === 'reactionTime';
    const isSpeed    = significant.metric === 'peakSpeed' || significant.metric === 'speed';

    const metric: AchievementMetric = {
      label: significant.metricLabel,
      value: isReaction ? (rawValue / 1000).toFixed(3) : isSpeed ? (rawValue * 3.6).toFixed(1) : rawValue.toFixed(2),
      unit: isReaction ? 's' : isSpeed ? ' km/h' : 'G',
      rawValue,
      improvementDisplay: significant.improvement,
    };

    return buildAchievement(inp, {
      type: 'milestone', scope: 'session', template: 'milestone',
      headlineTitle: nearTarget ? 'GOAL ALMOST\nCOMPLETE' : 'GOAL\nMILESTONE',
      headlineSubtitle: `${significant.metricLabel} — ${significant.percentToGoal}% to target`,
      metric,
      taglines: ['Set the goal.', 'Do the work.', 'Hit the target.'],
      confidence: 'high',
      sensitivity: 'public-safe',
    });
  });
}

function tryConditionPB(input: AchievementDetectorInput): Candidate {
  const { context, sessionStats, longitudinal, allTimePBs } = input;

  if (!context.trackSurface || !longitudinal?.contextualPatterns?.pbsByCondition) {
    return miss('condition-pb', 'session', 'insufficient-history');
  }

  const surfacePB = longitudinal.contextualPatterns.pbsByCondition[context.trackSurface];
  if (!surfacePB || surfacePB.sessionCount < MIN_CONDITION_SESSIONS) {
    return miss('condition-pb', 'session', 'condition-pb-insufficient-data');
  }

  if (!sessionStats.best_reaction_ms || !surfacePB.bestReactionMs) {
    return miss('condition-pb', 'session', 'no-meaningful-event');
  }

  // Don't surface condition PB when it's also an all-time PB — that wins outright
  if (allTimePBs.bestReactionMs !== null && sessionStats.best_reaction_ms < allTimePBs.bestReactionMs) {
    return miss('condition-pb', 'session', 'no-meaningful-event');
  }

  if (sessionStats.best_reaction_ms >= surfacePB.bestReactionMs) {
    return miss('condition-pb', 'session', 'no-meaningful-event');
  }

  const surfaceLabel  = formatSurface(context.trackSurface);
  const improvePct    = ((surfacePB.bestReactionMs - sessionStats.best_reaction_ms) / surfacePB.bestReactionMs) * 100;
  const bonus         = context.isChallengingConditions ? 5 : 0;

  return hit('condition-pb', 'session', bonus, (inp) => {
    const metric: AchievementMetric = {
      label: 'Reaction Time',
      value: (sessionStats.best_reaction_ms! / 1000).toFixed(3),
      unit: 's',
      rawValue: sessionStats.best_reaction_ms!,
      previousValue: surfacePB.bestReactionMs!,
      improvementPercent: improvePct,
      improvementDisplay: `${improvePct.toFixed(1)}% faster`,
      context: `on ${surfaceLabel.toLowerCase()}`,
    };

    return buildAchievement(inp, {
      type: 'condition-pb', scope: 'session', template: 'pb',
      headlineTitle: `${surfaceLabel.toUpperCase()}\nPERSONAL BEST`,
      headlineSubtitle: `Best reaction time across ${surfacePB.sessionCount} ${surfaceLabel.toLowerCase()} sessions`,
      metric,
      taglines: ['Different conditions.', 'Same commitment.', 'Better every time.'],
      confidence: surfacePB.sessionCount >= 5 ? 'high' : 'moderate',
      sensitivity: 'public-safe',
    });
  });
}

function tryFocusAlignment(input: AchievementDetectorInput): Candidate {
  const { context, sessionStats, intelligence, techniqueScores } = input;
  const focus = context.sessionFocus;
  if (!focus) return miss('focus-alignment', 'session', 'no-meaningful-event');

  let fires = false;
  let metric: AchievementMetric | null = null;
  let headlineSubtitle = '';

  switch (focus) {
    case 'reaction-time': {
      const withinPct = sessionStats.best_reaction_ms && input.allTimePBs.bestReactionMs
        ? ((sessionStats.best_reaction_ms - input.allTimePBs.bestReactionMs) / input.allTimePBs.bestReactionMs) * 100
        : Infinity;
      const bestBeatAvgPct = sessionStats.best_reaction_ms && sessionStats.avg_reaction_ms
        ? ((sessionStats.avg_reaction_ms - sessionStats.best_reaction_ms) / sessionStats.avg_reaction_ms) * 100
        : 0;
      if (withinPct <= 5 || bestBeatAvgPct >= 10) {
        fires = true;
        metric = {
          label: 'Reaction Time',
          value: (sessionStats.best_reaction_ms! / 1000).toFixed(3),
          unit: 's',
          rawValue: sessionStats.best_reaction_ms!,
        };
        headlineSubtitle = 'Reaction focus backed up by the data';
      }
      break;
    }
    case 'consistency': {
      if (
        (intelligence.repeatabilityScore !== null && intelligence.repeatabilityScore >= TECHNIQUE_GOOD) ||
        (sessionStats.reaction_cv !== null && sessionStats.reaction_cv <= CV_GOOD)
      ) {
        fires = true;
        const cv = sessionStats.reaction_cv ?? intelligence.repeatabilityCv;
        metric = {
          label: 'Consistency',
          value: cv !== null ? cv.toFixed(1) : '—',
          unit: '% variation',
          rawValue: cv ?? 0,
        };
        headlineSubtitle = 'Consistency focus — data delivered';
      }
      break;
    }
    case 'explosiveness': {
      if (
        (sessionStats.best_max_g !== null && input.allTimePBs.bestMaxG !== null && sessionStats.best_max_g >= input.allTimePBs.bestMaxG * 0.95) ||
        (techniqueScores?.explosiveness !== null && (techniqueScores?.explosiveness ?? 0) >= TECHNIQUE_GOOD)
      ) {
        fires = true;
        metric = {
          label: 'Peak G-Force',
          value: (sessionStats.best_max_g ?? 0).toFixed(2),
          unit: 'G',
          rawValue: sessionStats.best_max_g ?? 0,
        };
        headlineSubtitle = 'Explosiveness focus — gate force confirmed';
      }
      break;
    }
    case 'speed-carry': {
      if (
        sessionStats.has_valid_speed &&
        ((techniqueScores?.speedCarry !== null && (techniqueScores?.speedCarry ?? 0) >= TECHNIQUE_GOOD) ||
        (sessionStats.best_peak_speed_ms !== null && input.allTimePBs.bestSpeedMs !== null && sessionStats.best_peak_speed_ms >= input.allTimePBs.bestSpeedMs * 0.97))
      ) {
        fires = true;
        const kmh = (sessionStats.best_peak_speed_ms ?? 0) * 3.6;
        metric = {
          label: 'Peak Speed',
          value: kmh.toFixed(1),
          unit: ' km/h',
          rawValue: sessionStats.best_peak_speed_ms ?? 0,
        };
        headlineSubtitle = 'Speed & carry focus — speed confirmed';
      }
      break;
    }
    case 'endurance': {
      const avgRunCount = 6; // TODO: derive from rider history when available
      if (
        sessionStats.included_run_count >= avgRunCount &&
        intelligence.dropOffRun === null
      ) {
        fires = true;
        metric = {
          label: 'Runs Completed',
          value: String(sessionStats.included_run_count),
          unit: ' runs',
          rawValue: sessionStats.included_run_count,
        };
        headlineSubtitle = 'Endurance focus — quality held throughout';
      }
      break;
    }
  }

  if (!fires || !metric) return miss('focus-alignment', 'session', 'no-meaningful-event');

  const focusLabel = formatFocus(focus);
  return hit('focus-alignment', 'session', 0, (inp) => {
    return buildAchievement(inp, {
      type: 'focus-alignment', scope: 'session', template: 'session',
      headlineTitle: `${focusLabel.toUpperCase()}\nFOCUS`,
      headlineSubtitle,
      metric: metric!,
      taglines: [
        `Came to work on ${focusLabel.toLowerCase()}.`,
        'The data backed it up.',
        'That counts.',
      ],
      confidence: 'high',
      sensitivity: 'public-safe',
    });
  });
}

function trySessionQuality(input: AchievementDetectorInput): Candidate {
  const { intelligence } = input;

  // Excellent repeatability
  if (intelligence.repeatabilityScore !== null && intelligence.repeatabilityScore >= REPEATABILITY_HIGH) {
    return hit('session-quality', 'session', 5, (inp) => {
      const metric: AchievementMetric = {
        label: 'Repeatability',
        value: intelligence.repeatabilityScore!.toFixed(0),
        unit: '/100',
        rawValue: intelligence.repeatabilityScore!,
      };
      return buildAchievement(inp, {
        type: 'session-quality', scope: 'session', template: 'session',
        headlineTitle: 'LOCKED\nIN',
        headlineSubtitle: 'Exceptional repeatability across all runs',
        metric,
        taglines: ['Not just fast.', 'Consistently fast.', "That's the difference."],
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  // High session quality
  if (intelligence.sessionQuality !== null && intelligence.sessionQuality >= QUALITY_HIGH) {
    return hit('session-quality', 'session', 0, (inp) => {
      const metric: AchievementMetric = {
        label: 'Session Quality',
        value: intelligence.sessionQuality!.toFixed(0),
        unit: '/100',
        rawValue: intelligence.sessionQuality!,
      };
      return buildAchievement(inp, {
        type: 'session-quality', scope: 'session', template: 'session',
        headlineTitle: 'HIGH QUALITY\nSESSION',
        headlineSubtitle: 'Composite session score in the top range',
        metric,
        taglines: ['Every run.', 'Every metric.', 'Solid throughout.'],
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  // Quality held all the way through — no drop-off
  if (
    intelligence.dropOffRun === null &&
    intelligence.optimalSetLength !== null &&
    intelligence.sessionQuality !== null &&
    intelligence.sessionQuality >= QUALITY_MODERATE &&
    input.sessionStats.included_run_count >= 5
  ) {
    return hit('session-quality', 'session', -5, (inp) => {
      const metric: AchievementMetric = {
        label: 'Runs at Quality',
        value: String(input.sessionStats.included_run_count),
        unit: ' runs',
        rawValue: input.sessionStats.included_run_count,
      };
      return buildAchievement(inp, {
        type: 'session-quality', scope: 'session', template: 'session',
        headlineTitle: 'QUALITY\nSUSTAINED',
        headlineSubtitle: `${input.sessionStats.included_run_count} runs — no drop-off detected`,
        metric,
        taglines: ['Start to finish.', 'No fade.', 'That takes conditioning.'],
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  return miss('session-quality', 'session', 'no-meaningful-event');
}

function tryConsistency(input: AchievementDetectorInput): Candidate {
  const cv = input.sessionStats.reaction_cv;
  if (cv === null) return miss('consistency', 'session', 'no-meaningful-event');

  // Excellent consistency
  if (cv <= CV_EXCELLENT) {
    return hit('consistency', 'session', 5, (inp) => {
      const metric: AchievementMetric = {
        label: 'Consistency',
        value: cv.toFixed(1),
        unit: '% variation',
        rawValue: cv,
        context: 'across all runs — nearly identical each time',
      };
      return buildAchievement(inp, {
        type: 'consistency', scope: 'session', template: 'session',
        headlineTitle: 'LOCKED\nIN',
        headlineSubtitle: 'Gate sequence was exceptionally consistent',
        metric,
        taglines: ['Not just fast.', 'Consistently fast.', "That's the difference."],
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  // Good consistency
  if (cv <= CV_GOOD) {
    return hit('consistency', 'session', 0, (inp) => {
      const metric: AchievementMetric = {
        label: 'Consistency',
        value: cv.toFixed(1),
        unit: '% variation',
        rawValue: cv,
        context: `across ${input.sessionStats.included_run_count} runs`,
      };
      return buildAchievement(inp, {
        type: 'consistency', scope: 'session', template: 'session',
        headlineTitle: 'CONSISTENT\nSESSION',
        headlineSubtitle: `Gate sequence was solid across ${input.sessionStats.included_run_count} runs`,
        metric,
        taglines: ['Repeatable.', 'Reliable.', 'Building something real.'],
        confidence: 'high',
        sensitivity: 'public-safe',
      });
    });
  }

  return miss('consistency', 'session', 'no-meaningful-event');
}

function tryResilience(input: AchievementDetectorInput): Candidate {
  const { context, sessionStats, allTimePBs, intelligence } = input;

  const hasAdversity = context.isChallengingConditions || context.isLowReadiness;
  if (!hasAdversity) return miss('resilience', 'session', 'no-meaningful-event');

  if (input.dataQualityRating === 'unknown' || input.dataQualityRating === 'calibrate') {
    return miss('resilience', 'session', 'data-quality-unknown');
  }

  // Check for good output despite adversity
  const reactionNearPB = sessionStats.best_reaction_ms !== null &&
    allTimePBs.bestReactionMs !== null &&
    ((sessionStats.best_reaction_ms - allTimePBs.bestReactionMs) / allTimePBs.bestReactionMs) * 100 <= RESILIENCE_WITHIN_PCT;

  const goodRepeatability = intelligence.repeatabilityScore !== null &&
    intelligence.repeatabilityScore >= REPEATABILITY_MODERATE;

  const goodQuality = intelligence.sessionQuality !== null &&
    intelligence.sessionQuality >= QUALITY_MODERATE;

  if (!reactionNearPB && !goodRepeatability && !goodQuality) {
    return miss('resilience', 'session', 'no-meaningful-event');
  }

  // Score bonus for double adversity
  const bonus = context.isChallengingConditions && context.isLowReadiness ? 5 : 0;

  return hit('resilience', 'session', bonus, (inp) => {
    const metric: AchievementMetric = reactionNearPB
      ? {
          label: 'Reaction Time',
          value: (sessionStats.best_reaction_ms! / 1000).toFixed(3),
          unit: 's',
          rawValue: sessionStats.best_reaction_ms!,
          context: 'despite difficult conditions',
        }
      : {
          label: 'Session Quality',
          value: intelligence.sessionQuality!.toFixed(0),
          unit: '/100',
          rawValue: intelligence.sessionQuality!,
          context: 'despite difficult conditions',
        };

    return buildAchievement(inp, {
      type: 'resilience', scope: 'session', template: 'resilience',
      headlineTitle: 'SOLID\nUNDER PRESSURE',
      headlineSubtitle: buildAdversitySubtitle(context),
      metric,
      taglines: buildTaglines('resilience', context),
      confidence: 'moderate',
      sensitivity: 'public-safe',
    });
  });
}

function tryGoalProgress(input: AchievementDetectorInput): Candidate {
  const progress = input.goalProgress?.find(g => !g.isSignificant && g.percentToGoal > 0);
  if (!progress) return miss('goal-progress', 'session', 'no-meaningful-event');

  return hit('goal-progress', 'session', 0, (inp) => {
    const metric: AchievementMetric = {
      label: progress.metricLabel,
      value: String(progress.percentToGoal),
      unit: '% to goal',
      rawValue: progress.percentToGoal,
      improvementDisplay: progress.improvement,
    };
    return buildAchievement(inp, {
      type: 'goal-progress', scope: 'session', template: 'milestone',
      headlineTitle: 'MOVING\nFORWARD',
      headlineSubtitle: `${progress.metricLabel} — ${progress.percentToGoal}% of the way there`,
      metric,
      taglines: ['Every session.', 'Getting closer.', 'The goal is real.'],
      confidence: 'high',
      sensitivity: 'public-safe',
    });
  });
}

function tryEngineStrength(input: AchievementDetectorInput): Candidate {
  const { insightPack, intelligence } = input;

  if (
    !insightPack ||
    insightPack.strengths.length === 0 ||
    (intelligence.sessionQuality !== null && intelligence.sessionQuality < QUALITY_MODERATE)
  ) {
    return miss('engine-strength', 'session', 'no-meaningful-event');
  }

  return hit('engine-strength', 'session', 0, (inp) => {
    const topStrength = insightPack!.strengths[0];
    const metric: AchievementMetric = {
      label: topStrength,
      value: intelligence.sessionQuality?.toFixed(0) ?? '—',
      unit: '/100',
      rawValue: intelligence.sessionQuality ?? 0,
    };
    return buildAchievement(inp, {
      type: 'engine-strength', scope: 'session', template: 'session',
      headlineTitle: 'STRENGTH\nIDENTIFIED',
      headlineSubtitle: topStrength,
      metric,
      taglines: ['The data noticed.', 'Something is working.', 'Keep going.'],
      confidence: 'moderate',
      sensitivity: 'public-safe',
    });
  });
}

function tryProgression(input: AchievementDetectorInput): Candidate {
  const { longitudinal } = input;

  if (!longitudinal || longitudinal.sessionCount < MIN_LONGITUDINAL_SESSIONS) {
    return miss('progression', 'longitudinal', 'insufficient-history');
  }

  if (!longitudinal.reactionTrend.improving || !longitudinal.reactionTrend.changePercent) {
    return miss('progression', 'longitudinal', 'no-meaningful-event');
  }

  const pct = Math.abs(longitudinal.reactionTrend.changePercent);
  if (pct < MIN_PROGRESSION_PCT) return miss('progression', 'longitudinal', 'no-meaningful-event');

  return hit('progression', 'longitudinal', 0, (inp) => {
    const metric: AchievementMetric = {
      label: 'Reaction Time Trend',
      value: pct.toFixed(1),
      unit: '% faster',
      rawValue: pct,
      improvementPercent: pct,
      improvementDisplay: `${pct.toFixed(1)}% improvement`,
    };
    return buildAchievement(inp, {
      type: 'progression', scope: 'longitudinal', template: 'progression',
      headlineTitle: 'MOVING\nFORWARD',
      headlineSubtitle: `Reaction times ${pct.toFixed(1)}% faster over recent sessions`,
      metric,
      taglines: ["Progress isn't always", 'visible. Until it is.'],
      confidence: longitudinal.sessionCount >= 10 ? 'high' : 'moderate',
      sensitivity: 'public-safe',
    });
  });
}

function trySolidSession(input: AchievementDetectorInput): Candidate {
  const { sessionStats, intelligence, context } = input;

  const hasContext = context.weatherCondition || context.trackSurface ||
    context.sessionFocus || context.rideFeel;

  if (
    !hasContext ||
    intelligence.sessionQuality === null ||
    intelligence.sessionQuality < QUALITY_MODERATE
  ) {
    return miss('solid-session', 'session', 'no-meaningful-event');
  }

  return hit('solid-session', 'session', 0, (inp) => {
    const metric: AchievementMetric = {
      label: 'Session Quality',
      value: intelligence.sessionQuality!.toFixed(0),
      unit: '/100',
      rawValue: intelligence.sessionQuality!,
    };
    return buildAchievement(inp, {
      type: 'solid-session', scope: 'session', template: 'session',
      headlineTitle: 'SOLID\nSESSION',
      headlineSubtitle: `${sessionStats.included_run_count} runs — the work is accumulating`,
      metric,
      taglines: ['Showed up.', 'Put the work in.', 'Every session counts.'],
      confidence: 'moderate',
      sensitivity: 'public-safe',
    });
  });
}

// ── Achievement builder ───────────────────────────────────────────────────────

interface BuildSpec {
  type: AchievementType;
  scope: AchievementScope;
  template: CardTemplate;
  headlineTitle: string;
  headlineSubtitle: string;
  metric: AchievementMetric;
  taglines: string[];
  confidence: 'low' | 'moderate' | 'high';
  sensitivity: SensitivityLevel;
}

function buildAchievement(
  input: AchievementDetectorInput,
  spec: BuildSpec
): ShareableAchievement {
  return {
    id: `${input.sessionId}-${spec.type}-${spec.scope}`,
    sessionId: input.sessionId,
    riderId: input.riderId,
    scope: spec.scope,
    type: spec.type,
    template: spec.template,
    headlineTitle: spec.headlineTitle,
    headlineSubtitle: spec.headlineSubtitle,
    metric: spec.metric,
    conditionsBadge: buildConditionsBadge(input, spec.type),
    taglines: spec.taglines,
    supporting: buildSupportingContext(input, spec),
    context: input.context,
    confidence: spec.confidence,
    sensitivity: spec.sensitivity,
    isShareable: spec.confidence !== 'low' && spec.sensitivity === 'public-safe',
    privacyMode: input.privacyMode,
    riderDisplayName: input.riderDisplayName,
    riderClass: input.riderClass,
    sessionDate: input.sessionDate,
    createdAt: new Date().toISOString(),
  };
}

// ── Conditions badge ──────────────────────────────────────────────────────────

function buildConditionsBadge(input: AchievementDetectorInput, type: AchievementType): import('./types').ConditionsBadge | null {
  const { context } = input;
  const conditions: string[] = [];

  if (context.weatherCondition) conditions.push(formatWeather(context.weatherCondition));
  if (context.trackSurface) conditions.push(formatSurface(context.trackSurface));
  if (context.rideFeel === 'off') conditions.push('Low readiness');
  if (context.rideFeel === 'dialled' || context.rideFeel === 'peak') conditions.push('Peak readiness');

  if (conditions.length === 0) return null;

  const label = buildBadgeLabel(input);
  const icon  = buildBadgeIcon(context);
  const description = buildBadgeDescription(type, conditions);

  return { label, description, icon, conditions };
}

function buildBadgeLabel(input: AchievementDetectorInput): string {
  const { context } = input;

  if (context.isChallengingConditions && context.isLowReadiness) return 'Adversity Overcome';
  if (context.isChallengingConditions) {
    if (context.trackSurface === 'wet' || context.trackSurface === 'muddy') return 'Wet Weather Warrior';
    if (context.weatherCondition === 'cold') return 'Cold Start';
    if (context.weatherCondition === 'windy') return 'Into the Wind';
    return 'Conditions Conquered';
  }
  if (context.isLowReadiness) return 'Off Day Delivery';
  if (context.isHighReadiness) return 'Peak Readiness';
  if (context.sessionFocus) return `${formatFocus(context.sessionFocus)} Focus`;
  return 'Session Context';
}

function buildBadgeIcon(context: import('./types').AchievementContext): string {
  if (context.trackSurface === 'wet' || context.trackSurface === 'muddy') return '🌧️';
  if (context.weatherCondition === 'cold') return '🥶';
  if (context.weatherCondition === 'windy') return '💨';
  if (context.weatherCondition === 'rain' || context.weatherCondition === 'light-rain') return '🌧️';
  if (context.isLowReadiness) return '😔';
  if (context.isHighReadiness) return '🔥';
  if (context.sessionFocus === 'consistency') return '🎯';
  if (context.sessionFocus === 'reaction-time') return '⚡';
  if (context.sessionFocus === 'explosiveness') return '💥';
  return '📍';
}

function buildBadgeDescription(type: AchievementType, conditions: string[]): string {
  const condStr = conditions.join(', ');
  switch (type as string) {
    case 'pb':         return `Personal best achieved — ${condStr}`;
    case 'condition-pb': return `Condition best — ${condStr}`;
    case 'resilience': return `Strong output despite ${condStr}`;
    default:           return condStr;
  }
}

// ── Supporting context builder ─────────────────────────────────────────────────

function buildSupportingContext(
  input: AchievementDetectorInput,
  spec: BuildSpec
): SupportingContext {
  // Quote panel — derived from feel + achievement
  const { quoteNote, quotePunchline } = buildQuote(input, spec.type);

  // Progress since onboarding — when longitudinal data exists
  const progressSinceOnboarding = buildProgressRows(input);

  // Session highlights from intelligence
  const sessionHighlights = buildSessionHighlights(input);

  return { quoteNote, quotePunchline, progressSinceOnboarding, sessionHighlights };
}

function buildQuote(
  input: AchievementDetectorInput,
  type: AchievementType
): { quoteNote: string | null; quotePunchline: string | null } {
  const { context } = input;

  if (context.isLowReadiness && context.isChallengingConditions) {
    return {
      quoteNote: 'Not the best conditions today, not the best feeling...',
      quotePunchline: 'BUT STILL DELIVERED.',
    };
  }

  if (context.isLowReadiness) {
    return {
      quoteNote: 'Not feeling it today...',
      quotePunchline: 'BUT STILL BETTER.',
    };
  }

  if (context.isChallengingConditions) {
    return {
      quoteNote: 'Difficult conditions, not ideal...',
      quotePunchline: 'BUT THE DATA HELD UP.',
    };
  }

  if (context.isHighReadiness && (type === 'pb' || type === 'condition-pb')) {
    return {
      quoteNote: 'Feeling dialled, conditions solid...',
      quotePunchline: 'AND THE DATA AGREED.',
    };
  }

  switch (type) {
    case 'pb':           return { quoteNote: null, quotePunchline: 'RECORDS EXIST TO BE BROKEN.' };
    case 'milestone':    return { quoteNote: null, quotePunchline: 'THE GOAL IS IN SIGHT.' };
    case 'consistency':  return { quoteNote: null, quotePunchline: 'CONSISTENCY IS THE REAL SKILL.' };
    case 'resilience':   return { quoteNote: null, quotePunchline: "CONDITIONS DON'T DEFINE YOU." };
    case 'progression':  return { quoteNote: null, quotePunchline: 'PROGRESS IS HAPPENING.' };
    case 'solid-session': return { quoteNote: null, quotePunchline: 'THE WORK IS ACCUMULATING.' };
    default:             return { quoteNote: null, quotePunchline: 'KEEP GOING.' };
  }
}

function buildProgressRows(input: AchievementDetectorInput) {
  const { longitudinal } = input;
  if (!longitudinal || longitudinal.sessionCount < 3) return null;

  const rows = [];

  if (longitudinal.reactionTrend.changePercent !== null) {
    const pct = Math.abs(longitudinal.reactionTrend.changePercent);
    rows.push({
      label: 'Reaction Time',
      value: longitudinal.reactionTrend.improving ? `-${pct.toFixed(1)}%` : `+${pct.toFixed(1)}%`,
      trend: longitudinal.reactionTrend.improving ? 'improving' as const : 'declining' as const,
      trendLabel: longitudinal.reactionTrend.improving
        ? `${pct.toFixed(0)}% improvement`
        : `${pct.toFixed(0)}% slower`,
    });
  }

  if (longitudinal.consistencyTrend.improving) {
    rows.push({
      label: 'Consistency',
      value: 'Improving',
      trend: 'improving' as const,
      trendLabel: 'Great trend',
    });
  }

  return rows.length > 0 ? rows : null;
}

function buildSessionHighlights(input: AchievementDetectorInput) {
  const { intelligence, sessionStats } = input;
  const highlights = [];

  if (intelligence.sessionQuality !== null) {
    const label = intelligence.sessionQuality >= 75 ? 'Excellent'
      : intelligence.sessionQuality >= 60 ? 'Good'
      : 'Fair';
    highlights.push({ label: 'Session Quality', value: `${intelligence.sessionQuality.toFixed(0)}/100 · ${label}` });
  }

  if (intelligence.bestVsAvgGapPercent !== null && intelligence.bestVsAvgGapPercent <= BEST_VS_AVG_TIGHT) {
    highlights.push({ label: 'Best vs Average Gap', value: `${intelligence.bestVsAvgGapPercent.toFixed(1)}% · Excellent` });
  }

  return highlights.length > 0 ? highlights : null;
}

// ── Language helpers ──────────────────────────────────────────────────────────

function buildTaglines(type: AchievementType, context: import('./types').AchievementContext): string[] {
  if (context.isChallengingConditions && type === 'pb') {
    return ['Every session.', 'Every condition.', 'Every step forward.'];
  }
  if (type === 'resilience') {
    return ["Doesn't matter", 'how it feels.', 'The data speaks.'];
  }
  if (type === 'pb') {
    return ['Every session.', 'Every condition.', 'Every step forward.'];
  }
  return ['Every session.', 'Every step forward.'];
}

function buildAdversitySubtitle(context: import('./types').AchievementContext): string {
  if (context.isLowReadiness && context.isChallengingConditions) {
    return `Low readiness and ${formatConditionShort(context)} — delivered anyway`;
  }
  if (context.isLowReadiness) return 'Off day — the data held up';
  if (context.isChallengingConditions) return `${formatConditionShort(context)} — strong output`;
  return 'Adverse conditions — delivered';
}

function formatConditionShort(context: import('./types').AchievementContext): string {
  if (context.trackSurface === 'wet') return 'wet track';
  if (context.trackSurface === 'muddy') return 'muddy conditions';
  if (context.weatherCondition === 'rain' || context.weatherCondition === 'light-rain') return 'rain';
  if (context.weatherCondition === 'cold') return 'cold conditions';
  if (context.weatherCondition === 'windy') return 'wind';
  return 'difficult conditions';
}

function formatSurface(surface: string | null): string {
  if (!surface) return 'Track';
  const map: Record<string, string> = {
    'wet':          'Wet Track',
    'muddy':        'Muddy Track',
    'damp':         'Damp Surface',
    'dry-concrete': 'Dry Concrete',
    'dry-asphalt':  'Dry Asphalt',
    'indoor':       'Indoor',
  };
  return map[surface] ?? surface;
}

function formatWeather(weather: string | null): string {
  if (!weather) return '';
  const map: Record<string, string> = {
    'sunny':       'Sunny',
    'partly-cloudy': 'Partly Cloudy',
    'cloudy':      'Cloudy',
    'light-rain':  'Light Rain',
    'rain':        'Rain',
    'windy':       'Windy',
    'cold':        'Cold',
    'hot':         'Hot',
  };
  return map[weather] ?? weather;
}

function formatFocus(focus: string): string {
  const map: Record<string, string> = {
    'reaction-time': 'Reaction Time',
    'explosiveness': 'Explosiveness',
    'speed-carry':   'Speed & Carry',
    'consistency':   'Consistency',
    'endurance':     'Endurance',
    'technique':     'Technique',
    'recovery':      'Recovery',
    'testing':       'Testing',
  };
  return map[focus] ?? focus;
}

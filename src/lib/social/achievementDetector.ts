/**
 * Social Layer — Achievement Detector
 *
 * Deterministic detection of meaningful rider achievements.
 * Given the same inputs, always produces the same output.
 *
 * Detection flow:
 *   1. Validity gate — suppress everything if the session data can't be trusted
 *   2. Candidate generation — evaluate each achievement category
 *   3. Candidate ranking — score each by meaningfulness
 *   4. Safety/privacy filter — remove anything not appropriate for sharing
 *   5. Return the strongest candidate (or null with suppression reason)
 *
 * Deliberately conservative:
 *   - Requires stat-eligible runs ≥ 3 for session-level claims
 *   - Requires longitudinal data for longitudinal claims
 *   - Condition-specific PBs require ≥ 3 sessions in that condition
 *   - Resilience achievements require both the adversity AND good data quality
 *   - Nothing is generated from a testing, technique, or recovery session
 */

import type {
  AchievementDetectorInput,
  AchievementDetectionResult,
  ShareableAchievement,
  AchievementType,
  AchievementScope,
  AchievementContext,
  AchievementMetric,
  CardTemplate,
  SuppressionReason,
  SensitivityLevel,
} from './types';

// ── Scoring weights ────────────────────────────────────────────────────────────
// Higher score = stronger claim = more likely to be the chosen achievement.
// These are internal only — never shown to users.

const SCORES: Record<AchievementType, number> = {
  'pb':           100,  // All-time PB is always the strongest claim
  'milestone':     90,  // Goal milestone is nearly as strong
  'condition-pb':  70,  // Condition PB is meaningful but context-limited
  'resilience':    60,  // Resilience is emotionally significant
  'consistency':   50,  // Consistency achievements are valuable but quieter
  'progression':   40,  // Longitudinal progression — good but less immediate
  'trend':         30,  // Sustained trend — worth noting but weakest claim
};

// ── Minimum thresholds ────────────────────────────────────────────────────────

const MIN_STAT_RUNS        = 3;   // Minimum stats-eligible runs for session claims
const MIN_CONDITION_SESSIONS = 3; // Minimum sessions in a condition for condition PBs
const MIN_SESSIONS_LONGITUDINAL = 5; // Minimum sessions for longitudinal claims
const MIN_PROGRESSION_PCT  = 3;   // Minimum % improvement to call it progression
const GOOD_CV_THRESHOLD    = 8;   // CV% below this = good consistency
const EXCELLENT_CV_THRESHOLD = 5; // CV% below this = excellent consistency

/**
 * Main entry point.
 * Detects the strongest meaningful achievement from session data.
 */
export function detectAchievement(
  input: AchievementDetectorInput
): AchievementDetectionResult {

  // ── Step 1: Validity gate ──────────────────────────────────────────────────
  const validityCheck = checkValidity(input);
  if (validityCheck) {
    return {
      achievement: null,
      candidates: [],
      suppressionReason: validityCheck,
    };
  }

  // ── Step 2: Generate candidates ────────────────────────────────────────────
  const candidates: Array<{
    type: AchievementType;
    scope: AchievementScope;
    suppressed: boolean;
    suppressionReason?: SuppressionReason;
    score: number;
    achievement?: ShareableAchievement;
  }> = [];

  // Personal bests
  const pbResult = detectPB(input);
  candidates.push(pbResult);

  // Goal milestones
  const milestoneResult = detectMilestone(input);
  candidates.push(milestoneResult);

  // Condition-specific PB
  const conditionPBResult = detectConditionPB(input);
  candidates.push(conditionPBResult);

  // Resilience
  const resilienceResult = detectResilience(input);
  candidates.push(resilienceResult);

  // Consistency
  const consistencyResult = detectConsistency(input);
  candidates.push(consistencyResult);

  // Longitudinal progression
  const progressionResult = detectProgression(input);
  candidates.push(progressionResult);

  // ── Step 3: Rank and filter ────────────────────────────────────────────────
  const viable = candidates
    .filter(c => !c.suppressed && c.achievement)
    .sort((a, b) => b.score - a.score);

  if (viable.length === 0) {
    return {
      achievement: null,
      candidates: candidates.map(c => ({
        type: c.type,
        scope: c.scope,
        suppressed: c.suppressed,
        suppressionReason: c.suppressionReason,
        score: c.score,
      })),
      suppressionReason: 'no-meaningful-event',
    };
  }

  const chosen = viable[0].achievement!;

  return {
    achievement: chosen,
    candidates: candidates.map(c => ({
      type: c.type,
      scope: c.scope,
      suppressed: c.suppressed,
      suppressionReason: c.suppressionReason,
      score: c.score,
    })),
    suppressionReason: null,
  };
}

// ── Validity gate ─────────────────────────────────────────────────────────────

function checkValidity(input: AchievementDetectorInput): SuppressionReason | null {
  // Testing and technique sessions — intentional variation, not achievement context
  if (
    input.context.sessionFocus === 'testing' ||
    input.context.sessionFocus === 'technique'
  ) {
    return 'testing-session';
  }

  // Recovery sessions — explicitly not for comparison
  if (input.context.sessionFocus === 'recovery') {
    return 'recovery-session';
  }

  // Calibration failure — derived metrics can't be trusted
  if (input.dataQualityRating === 'calibrate') {
    return 'invalid-telemetry';
  }

  // Not enough stat-eligible runs for any session-level claim
  if (input.sessionStats.included_run_count < MIN_STAT_RUNS) {
    return 'incomplete-session';
  }

  return null;
}

// ── PB detection ──────────────────────────────────────────────────────────────

function detectPB(input: AchievementDetectorInput) {
  const { sessionStats, allTimePBs, context } = input;

  // Reaction time PB — direct measurement, always reliable
  if (
    sessionStats.best_reaction_ms !== null &&
    allTimePBs.bestReactionMs !== null &&
    sessionStats.best_reaction_ms < allTimePBs.bestReactionMs
  ) {
    const improvePct = ((allTimePBs.bestReactionMs - sessionStats.best_reaction_ms) / allTimePBs.bestReactionMs) * 100;
    const metric: AchievementMetric = {
      label: 'Reaction Time',
      value: (sessionStats.best_reaction_ms / 1000).toFixed(3),
      unit: 's',
      rawValue: sessionStats.best_reaction_ms,
      previousValue: allTimePBs.bestReactionMs,
      improvementPercent: improvePct,
      improvementDisplay: `${improvePct.toFixed(1)}% faster`,
    };

    return {
      type: 'pb' as AchievementType,
      scope: 'session' as AchievementScope,
      suppressed: false,
      score: SCORES['pb'],
      achievement: buildAchievement(input, {
        type: 'pb',
        scope: 'session',
        template: 'pb',
        title: 'New Personal Best',
        subtitle: `Fastest reaction time ever recorded — ${metric.value}${metric.unit}`,
        contextLine: buildContextLine(context),
        narrativeNote: context.isChallengingConditions
          ? 'Setting a PB in these conditions carries extra weight.'
          : null,
        metric,
        confidence: 'high',
        sensitivity: 'public-safe',
      }),
    };
  }

  // Speed PB — only when analytics_valid (derived metric)
  if (
    sessionStats.has_valid_speed &&
    sessionStats.best_peak_speed_ms !== null &&
    allTimePBs.bestSpeedMs !== null &&
    sessionStats.best_peak_speed_ms > allTimePBs.bestSpeedMs &&
    input.dataQualityRating !== 'unknown' // Don't claim speed PBs on unknown quality
  ) {
    const currentKmh  = sessionStats.best_peak_speed_ms * 3.6;
    const previousKmh = allTimePBs.bestSpeedMs * 3.6;
    const improvePct  = ((currentKmh - previousKmh) / previousKmh) * 100;

    const metric: AchievementMetric = {
      label: 'Peak Speed',
      value: currentKmh.toFixed(1),
      unit: ' km/h',
      rawValue: sessionStats.best_peak_speed_ms,
      previousValue: allTimePBs.bestSpeedMs,
      improvementPercent: improvePct,
      improvementDisplay: `+${(currentKmh - previousKmh).toFixed(1)} km/h`,
    };

    return {
      type: 'pb' as AchievementType,
      scope: 'session' as AchievementScope,
      suppressed: false,
      score: SCORES['pb'] - 5, // Slightly lower than reaction PB — derived metric
      achievement: buildAchievement(input, {
        type: 'pb',
        scope: 'session',
        template: 'pb',
        title: 'New Personal Best',
        subtitle: `Fastest gate exit speed on record — ${metric.value}${metric.unit}`,
        contextLine: buildContextLine(context),
        narrativeNote: 'Speed is IMU-estimated — this is a directional result, not a precision measurement.',
        metric,
        confidence: 'moderate', // Speed is estimated
        sensitivity: 'public-safe',
      }),
    };
  }

  // Max G PB
  if (
    sessionStats.best_max_g !== null &&
    allTimePBs.bestMaxG !== null &&
    sessionStats.best_max_g > allTimePBs.bestMaxG
  ) {
    const improvePct = ((sessionStats.best_max_g - allTimePBs.bestMaxG) / allTimePBs.bestMaxG) * 100;
    const metric: AchievementMetric = {
      label: 'Peak G-Force',
      value: sessionStats.best_max_g.toFixed(2),
      unit: 'G',
      rawValue: sessionStats.best_max_g,
      previousValue: allTimePBs.bestMaxG,
      improvementPercent: improvePct,
      improvementDisplay: `+${(sessionStats.best_max_g - allTimePBs.bestMaxG).toFixed(2)}G`,
    };

    return {
      type: 'pb' as AchievementType,
      scope: 'session' as AchievementScope,
      suppressed: false,
      score: SCORES['pb'] - 10,
      achievement: buildAchievement(input, {
        type: 'pb',
        scope: 'session',
        template: 'pb',
        title: 'New Personal Best',
        subtitle: `Highest peak G-force recorded — ${metric.value}${metric.unit}`,
        contextLine: buildContextLine(context),
        narrativeNote: null,
        metric,
        confidence: 'high',
        sensitivity: 'public-safe',
      }),
    };
  }

  return {
    type: 'pb' as AchievementType,
    scope: 'session' as AchievementScope,
    suppressed: true,
    suppressionReason: 'no-meaningful-event' as SuppressionReason,
    score: 0,
  };
}

// ── Milestone detection ───────────────────────────────────────────────────────

function detectMilestone(input: AchievementDetectorInput) {
  const significant = input.goalProgress?.find(g => g.isSignificant);

  if (!significant) {
    return {
      type: 'milestone' as AchievementType,
      scope: 'session' as AchievementScope,
      suppressed: true,
      suppressionReason: 'no-meaningful-event' as SuppressionReason,
      score: 0,
    };
  }

  const isReaction = significant.metric === 'reactionTime';
  const isSpeed    = significant.metric === 'peakSpeed' || significant.metric === 'speed';
  const rawValue   = significant.newValue ?? 0;

  const metric: AchievementMetric = {
    label: significant.metricLabel,
    value: isReaction ? (rawValue / 1000).toFixed(3)
         : isSpeed    ? (rawValue * 3.6).toFixed(1)
         : rawValue.toFixed(2),
    unit: isReaction ? 's' : isSpeed ? ' km/h' : 'G',
    rawValue,
    improvementDisplay: significant.improvement,
  };

  // Near-completion is a stronger narrative than early progress
  const nearTarget = significant.percentToGoal >= 80;

  return {
    type: 'milestone' as AchievementType,
    scope: 'session' as AchievementScope,
    suppressed: false,
    score: SCORES['milestone'] + (nearTarget ? 5 : 0),
    achievement: buildAchievement(input, {
      type: 'milestone',
      scope: 'session',
      template: 'milestone',
      title: nearTarget ? 'Goal Almost Complete' : 'Goal Milestone',
      subtitle: `${significant.metricLabel} — ${significant.improvement}. ${significant.percentToGoal}% to target.`,
      contextLine: buildContextLine(input.context),
      narrativeNote: nearTarget
        ? `${100 - significant.percentToGoal}% remaining to reach the goal.`
        : null,
      metric,
      confidence: 'high',
      sensitivity: 'public-safe',
    }),
  };
}

// ── Condition PB detection ────────────────────────────────────────────────────

function detectConditionPB(input: AchievementDetectorInput) {
  const { context, sessionStats, longitudinal } = input;

  // Need a surface set and longitudinal context
  if (!context.trackSurface || !longitudinal?.contextualPatterns?.pbsByCondition) {
    return suppressed('condition-pb', 'session', 'insufficient-history');
  }

  const conditionPBs = longitudinal.contextualPatterns.pbsByCondition;
  const thisSurface  = context.trackSurface;
  const surfacePB    = conditionPBs[thisSurface];

  // Need enough sessions in this condition
  if (!surfacePB || surfacePB.sessionCount < MIN_CONDITION_SESSIONS) {
    return suppressed('condition-pb', 'session', 'condition-pb-insufficient-data');
  }

  // Need a reaction time to compare
  if (
    sessionStats.best_reaction_ms === null ||
    surfacePB.bestReactionMs === null
  ) {
    return suppressed('condition-pb', 'session', 'no-meaningful-event');
  }

  // Is this a new condition PB?
  if (sessionStats.best_reaction_ms >= surfacePB.bestReactionMs) {
    return suppressed('condition-pb', 'session', 'no-meaningful-event');
  }

  // Don't surface a condition PB if it's also an all-time PB
  // (the all-time PB is a stronger and cleaner claim)
  if (
    input.allTimePBs.bestReactionMs !== null &&
    sessionStats.best_reaction_ms < input.allTimePBs.bestReactionMs
  ) {
    return suppressed('condition-pb', 'session', 'no-meaningful-event');
  }

  const surfaceLabel = formatSurface(thisSurface);
  const improvePct   = ((surfacePB.bestReactionMs - sessionStats.best_reaction_ms) / surfacePB.bestReactionMs) * 100;

  const metric: AchievementMetric = {
    label: 'Reaction Time',
    value: (sessionStats.best_reaction_ms / 1000).toFixed(3),
    unit: 's',
    rawValue: sessionStats.best_reaction_ms,
    previousValue: surfacePB.bestReactionMs,
    improvementPercent: improvePct,
    improvementDisplay: `${improvePct.toFixed(1)}% faster`,
  };

  return {
    type: 'condition-pb' as AchievementType,
    scope: 'session' as AchievementScope,
    suppressed: false,
    score: SCORES['condition-pb'],
    achievement: buildAchievement(input, {
      type: 'condition-pb',
      scope: 'session',
      template: 'pb',
      title: `${surfaceLabel} Personal Best`,
      subtitle: `Best reaction time on ${surfaceLabel.toLowerCase()} — ${metric.value}${metric.unit}`,
      contextLine: buildContextLine(input.context),
      narrativeNote: `Best across ${surfacePB.sessionCount} ${surfaceLabel.toLowerCase()} sessions.`,
      metric,
      confidence: surfacePB.sessionCount >= 5 ? 'high' : 'moderate',
      sensitivity: 'public-safe',
    }),
  };
}

// ── Resilience detection ──────────────────────────────────────────────────────

function detectResilience(input: AchievementDetectorInput) {
  const { context, sessionStats, allTimePBs } = input;

  // Need adversity — challenging conditions OR low readiness
  const hasAdversity = context.isChallengingConditions || context.isLowReadiness;
  if (!hasAdversity) {
    return suppressed('resilience', 'session', 'no-meaningful-event');
  }

  // Need good data quality — resilience claims need reliable numbers
  if (input.dataQualityRating === 'unknown' || input.dataQualityRating === 'calibrate') {
    return suppressed('resilience', 'session', 'data-quality-unknown');
  }

  // Check for good performance despite adversity
  // "Good" = within 5% of all-time PB
  if (
    sessionStats.best_reaction_ms === null ||
    allTimePBs.bestReactionMs === null
  ) {
    return suppressed('resilience', 'session', 'no-meaningful-event');
  }

  const withinPct = ((sessionStats.best_reaction_ms - allTimePBs.bestReactionMs) / allTimePBs.bestReactionMs) * 100;

  // Must be within 5% of PB to qualify as "good despite adversity"
  if (withinPct > 5) {
    return suppressed('resilience', 'session', 'no-meaningful-event');
  }

  const adversityDescription = buildAdversityDescription(context);
  const metric: AchievementMetric = {
    label: 'Reaction Time',
    value: (sessionStats.best_reaction_ms / 1000).toFixed(3),
    unit: 's',
    rawValue: sessionStats.best_reaction_ms,
  };

  return {
    type: 'resilience' as AchievementType,
    scope: 'session' as AchievementScope,
    suppressed: false,
    score: SCORES['resilience'],
    achievement: buildAchievement(input, {
      type: 'resilience',
      scope: 'session',
      template: 'resilience',
      title: 'Solid Session',
      subtitle: `Near-PB performance ${adversityDescription}`,
      contextLine: buildContextLine(context),
      narrativeNote: context.isLowReadiness && context.isChallengingConditions
        ? 'Low readiness and difficult conditions — maintaining this level takes real mental strength.'
        : context.isChallengingConditions
        ? 'Difficult conditions — these numbers hold up well against dry-track standards.'
        : 'Off day — the data held up better than it felt.',
      metric,
      confidence: 'moderate',
      sensitivity: 'public-safe',
    }),
  };
}

// ── Consistency detection ─────────────────────────────────────────────────────

function detectConsistency(input: AchievementDetectorInput) {
  const { sessionStats } = input;

  if (sessionStats.reaction_cv === null) {
    return suppressed('consistency', 'session', 'no-meaningful-event');
  }

  // Excellent consistency — tighter threshold
  if (sessionStats.reaction_cv <= EXCELLENT_CV_THRESHOLD) {
    const metric: AchievementMetric = {
      label: 'Consistency (CV%)',
      value: sessionStats.reaction_cv.toFixed(1),
      unit: '%',
      rawValue: sessionStats.reaction_cv,
    };

    return {
      type: 'consistency' as AchievementType,
      scope: 'session' as AchievementScope,
      suppressed: false,
      score: SCORES['consistency'] + 10,
      achievement: buildAchievement(input, {
        type: 'consistency',
        scope: 'session',
        template: 'consistency',
        title: 'Excellent Consistency',
        subtitle: `${sessionStats.reaction_cv.toFixed(1)}% CV — very tight session, runs were nearly identical`,
        contextLine: buildContextLine(input.context),
        narrativeNote: 'Low CV% across multiple runs indicates a reliable, repeatable start.',
        metric,
        confidence: 'high',
        sensitivity: 'public-safe',
      }),
    };
  }

  // Good consistency — only surface if no stronger achievement was found
  // (this is checked at ranking time — low score means it only wins if nothing else fires)
  if (sessionStats.reaction_cv <= GOOD_CV_THRESHOLD) {
    const metric: AchievementMetric = {
      label: 'Consistency (CV%)',
      value: sessionStats.reaction_cv.toFixed(1),
      unit: '%',
      rawValue: sessionStats.reaction_cv,
    };

    return {
      type: 'consistency' as AchievementType,
      scope: 'session' as AchievementScope,
      suppressed: false,
      score: SCORES['consistency'],
      achievement: buildAchievement(input, {
        type: 'consistency',
        scope: 'session',
        template: 'consistency',
        title: 'Consistent Session',
        subtitle: `${sessionStats.reaction_cv.toFixed(1)}% CV across ${sessionStats.included_run_count} runs`,
        contextLine: buildContextLine(input.context),
        narrativeNote: null,
        metric,
        confidence: 'high',
        sensitivity: 'public-safe',
      }),
    };
  }

  return suppressed('consistency', 'session', 'no-meaningful-event');
}

// ── Longitudinal progression detection ───────────────────────────────────────

function detectProgression(input: AchievementDetectorInput) {
  const { longitudinal } = input;

  if (!longitudinal || longitudinal.sessionCount < MIN_SESSIONS_LONGITUDINAL) {
    return suppressed('progression', 'longitudinal', 'insufficient-history');
  }

  const reactionTrend = longitudinal.reactionTrend;

  // Need a meaningful improving trend
  if (!reactionTrend.improving || reactionTrend.changePercent === null) {
    return suppressed('progression', 'longitudinal', 'no-meaningful-event');
  }

  const improvePct = Math.abs(reactionTrend.changePercent);
  if (improvePct < MIN_PROGRESSION_PCT) {
    return suppressed('progression', 'longitudinal', 'no-meaningful-event');
  }

  const metric: AchievementMetric = {
    label: 'Reaction Time Trend',
    value: improvePct.toFixed(1),
    unit: '% faster',
    rawValue: improvePct,
    improvementPercent: improvePct,
    improvementDisplay: `${improvePct.toFixed(1)}% improvement`,
  };

  return {
    type: 'progression' as AchievementType,
    scope: 'longitudinal' as AchievementScope,
    suppressed: false,
    score: SCORES['progression'],
    achievement: buildAchievement(input, {
      type: 'progression',
      scope: 'longitudinal',
      template: 'progression',
      title: 'Progress Trend',
      subtitle: `Reaction times ${improvePct.toFixed(1)}% faster over recent sessions`,
      contextLine: null,
      narrativeNote: `Based on ${longitudinal.sessionCount} sessions.`,
      metric,
      confidence: longitudinal.sessionCount >= 10 ? 'high' : 'moderate',
      sensitivity: 'public-safe',
    }),
  };
}

// ── Builder helpers ───────────────────────────────────────────────────────────

interface AchievementSpec {
  type: AchievementType;
  scope: AchievementScope;
  template: CardTemplate;
  title: string;
  subtitle: string;
  contextLine: string | null;
  narrativeNote: string | null;
  metric: AchievementMetric;
  confidence: 'low' | 'moderate' | 'high';
  sensitivity: SensitivityLevel;
}

function buildAchievement(
  input: AchievementDetectorInput,
  spec: AchievementSpec
): ShareableAchievement {
  const isShareable =
    spec.confidence !== 'low' &&
    spec.sensitivity === 'public-safe';

  return {
    id: `${input.sessionId}-${spec.type}-${spec.scope}`,
    sessionId: input.sessionId,
    riderId: input.riderId,
    scope: spec.scope,
    type: spec.type,
    template: spec.template,
    title: spec.title,
    subtitle: spec.subtitle,
    contextLine: spec.contextLine,
    narrativeNote: spec.narrativeNote,
    metric: spec.metric,
    context: input.context,
    confidence: spec.confidence,
    sensitivity: spec.sensitivity,
    isShareable,
    privacyMode: input.privacyMode,
    riderDisplayName: input.riderDisplayName,
    sessionDate: input.sessionDate,
    createdAt: new Date().toISOString(),
  };
}

function suppressed(
  type: AchievementType,
  scope: AchievementScope,
  reason: SuppressionReason
) {
  return {
    type,
    scope,
    suppressed: true,
    suppressionReason: reason,
    score: 0,
  };
}

// ── Context line builders ─────────────────────────────────────────────────────

function buildContextLine(context: AchievementContext): string | null {
  const parts: string[] = [];

  if (context.isLowReadiness && context.isChallengingConditions) {
    parts.push('Despite low readiness and difficult conditions');
  } else if (context.isLowReadiness) {
    parts.push('Despite an off day');
  } else if (context.isChallengingConditions) {
    parts.push(`Despite ${formatConditions(context)}`);
  }

  if (parts.length === 0) return null;
  return parts.join(', ');
}

function buildAdversityDescription(context: AchievementContext): string {
  if (context.isLowReadiness && context.isChallengingConditions) {
    return `despite low readiness and ${formatConditions(context)}`;
  }
  if (context.isLowReadiness) return 'on an off day';
  if (context.isChallengingConditions) return `in ${formatConditions(context)}`;
  return 'in adverse conditions';
}

function formatConditions(context: AchievementContext): string {
  const parts: string[] = [];
  if (context.trackSurface === 'wet')   parts.push('wet track');
  if (context.trackSurface === 'muddy') parts.push('muddy conditions');
  if (context.trackSurface === 'damp')  parts.push('damp surface');
  if (context.weatherCondition === 'rain' || context.weatherCondition === 'light-rain') parts.push('rain');
  if (context.weatherCondition === 'windy') parts.push('wind');
  if (context.weatherCondition === 'cold')  parts.push('cold conditions');
  return parts.join(' and ') || 'difficult conditions';
}

function formatSurface(surface: string): string {
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
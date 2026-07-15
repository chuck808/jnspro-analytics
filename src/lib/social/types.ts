/**
 * Social Layer — Core Types v2
 *
 * Rebuilt from the Shareable Insights Specification.
 *
 * Design principles:
 *   - The card tells the session story first, the achievement second
 *   - Every achievement carries the full context that makes it meaningful
 *   - The triggering metric is always the one that earned the card
 *   - The conditions badge contextualises it — weather, surface, feel
 *   - Validity is first-class — achievements know why they cannot be shared
 *   - Deterministic — same inputs always produce same output
 */

// ── Scope ─────────────────────────────────────────────────────────────────────

export type AchievementScope =
  | 'run'           // Something meaningful in a single gate run
  | 'session'       // Something meaningful across the whole session
  | 'longitudinal'; // Something meaningful compared to history

// ── Type ──────────────────────────────────────────────────────────────────────

export type AchievementType =
  | 'pb'                  // All-time personal best on any metric
  | 'condition-pb'        // Personal best within a specific condition
  | 'milestone'           // Goal milestone reached
  | 'focus-alignment'     // Rider declared focus and data supported it
  | 'session-quality'     // High quality session or excellent repeatability
  | 'consistency'         // Excellent consistency (plain English translation of CV%)
  | 'resilience'          // Good output despite challenging conditions or low readiness
  | 'goal-progress'       // Meaningful movement toward an active goal
  | 'engine-strength'     // Engine identified strengths via insightPack
  | 'progression'         // Longitudinal improvement trend
  | 'solid-session';      // Showed up, produced clean data, work is accumulating

// ── Template ──────────────────────────────────────────────────────────────────

export type CardTemplate =
  | 'pb'            // Bold metric — all-time and condition PBs
  | 'milestone'     // Goal arc — milestone and goal progress
  | 'session'       // Session quality, consistency, focus alignment
  | 'resilience'    // Context-forward — adversity + output
  | 'progression';  // Trend-forward — longitudinal improvement

// ── Privacy ───────────────────────────────────────────────────────────────────

export type PrivacyMode =
  | 'private'
  | 'club'
  | 'anonymous'
  | 'public';

// ── Sensitivity ───────────────────────────────────────────────────────────────

export type SensitivityLevel =
  | 'public-safe'
  | 'private'
  | 'coach-only';

// ── Suppression reason ────────────────────────────────────────────────────────

export type SuppressionReason =
  | 'low-confidence'
  | 'invalid-telemetry'
  | 'testing-session'
  | 'recovery-session'
  | 'incomplete-session'
  | 'insufficient-history'
  | 'no-meaningful-event'
  | 'data-quality-unknown'
  | 'condition-pb-insufficient-data';

// ── Session context ───────────────────────────────────────────────────────────

export interface AchievementContext {
  weatherCondition: string | null;
  trackSurface: string | null;
  sessionFocus: string | null;
  rideFeel: string | null;
  isChallengingConditions: boolean;
  isLowReadiness: boolean;
  isHighReadiness: boolean;
}

// ── Achievement metric ────────────────────────────────────────────────────────

export interface AchievementMetric {
  label: string;
  value: string;
  unit: string;
  rawValue: number;
  previousValue?: number;
  improvementPercent?: number;
  improvementDisplay?: string;
  context?: string;
}

// ── Conditions badge ──────────────────────────────────────────────────────────

export interface ConditionsBadge {
  label: string;
  description: string;
  icon: string;
  conditions: string[];
}

// ── Supporting context ────────────────────────────────────────────────────────

export interface SupportingContext {
  quoteNote: string | null;
  quotePunchline: string | null;
  progressSinceOnboarding: Array<{
    label: string;
    value: string;
    trend: 'improving' | 'stable' | 'declining';
    trendLabel: string;
  }> | null;
  sessionHighlights: Array<{
    label: string;
    value: string;
  }> | null;
}

// ── The shareable achievement ─────────────────────────────────────────────────

export interface ShareableAchievement {
  id: string;
  sessionId: string;
  riderId: string;

  scope: AchievementScope;
  type: AchievementType;
  template: CardTemplate;

  headlineTitle: string;
  headlineSubtitle: string;
  metric: AchievementMetric;
  conditionsBadge: ConditionsBadge | null;
  taglines: string[];
  supporting: SupportingContext;
  context: AchievementContext;

  confidence: 'low' | 'moderate' | 'high';
  sensitivity: SensitivityLevel;
  isShareable: boolean;

  privacyMode: PrivacyMode;
  riderDisplayName: string;
  riderClass: string | null;
  sessionDate: string;
  createdAt: string;
}

// ── Detection input ───────────────────────────────────────────────────────────

export interface AchievementDetectorInput {
  sessionId: string;
  riderId: string;
  riderDisplayName: string;
  riderClass: string | null;
  sessionDate: string;

  sessionStats: {
    run_count: number;
    included_run_count: number;
    excluded_run_count: number;
    best_reaction_ms: number | null;
    avg_reaction_ms: number | null;
    reaction_cv: number | null;
    best_peak_speed_ms: number | null;
    avg_peak_speed_ms: number | null;
    best_max_g: number | null;
    wheelie_count: number;
    has_valid_speed: boolean;
  };

  intelligence: {
    sessionQuality: number | null;
    repeatabilityScore: number | null;
    repeatabilityCv: number | null;
    repeatabilityLabel: string | null;
    bestVsAvgGapPercent: number | null;
    dropOffRun: number | null;
    optimalSetLength: number | null;
    fatigueTrend: 'stable' | 'declining' | null;
  };

  techniqueScores: {
    launchQuality: number | null;
    explosiveness: number | null;
    speedCarry: number | null;
    smoothness: number | null;
    repeatability: number | null;
  } | null;

  impulse: {
    totalImpulseNs: number;
    timeToHalfImpulseS: number;
    frontLoadedScore: number;
    impulseEfficiency: number;
  } | null;

  insightPack: {
    strengths: Array<{ id: string; title: string; body: string }>;
    limiters: Array<{ id: string; title: string; body: string }>;
  } | null;

  allTimePBs: {
    bestReactionMs: number | null;
    bestSpeedMs: number | null;
    bestMaxG: number | null;
    bestConsistencyCv: number | null;
    bestSessionQuality: number | null;
  };

  goalProgress: Array<{
    goalId: string;
    metric: string;
    metricLabel: string;
    improvement: string;
    percentToGoal: number;
    isSignificant: boolean;
    newValue?: number | null;
  }> | null;

  context: AchievementContext;

  dataQualityRating: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null;
  analyticsValid: boolean;
  hasCalibrationWarning: boolean;

  longitudinal: {
    sessionCount: number;
    overallTrend: string;
    reactionTrend: {
      direction: string;
      changePercent: number | null;
      improving: boolean;
    };
    consistencyTrend: {
      direction: string;
      improving: boolean;
    };
    contextualPatterns: {
      pbsByCondition: Record<string, {
        surface: string | null;
        bestReactionMs: number | null;
        sessionCount: number;
      }>;
      patterns: Array<{
        variable: string;
        metric: string;
        finding: string;
        bestCondition: string | null;
        confidence: string;
      }>;
    } | null;
  } | null;

  privacyMode: PrivacyMode;
}

// ── Detection result ──────────────────────────────────────────────────────────

export interface AchievementDetectionResult {
  achievement: ShareableAchievement | null;
  candidates: Array<{
    type: AchievementType;
    scope: AchievementScope;
    suppressed: boolean;
    suppressionReason?: SuppressionReason;
    score: number;
  }>;
  suppressionReason: SuppressionReason | null;
}

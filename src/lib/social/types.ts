/**
 * Social Layer — Core Types
 *
 * Defines the ShareableAchievement type and supporting structures.
 *
 * Design principles:
 *   - Every achievement carries the context that makes it meaningful
 *   - Validity is first-class — achievements know why they can or cannot be shared
 *   - Scope is explicit — run, session, or longitudinal
 *   - Privacy is built in — not bolted on
 *   - The type is deterministic — given the same inputs, the same achievement
 *     is always produced (no random variation, no AI generation)
 */

// ── Scope ─────────────────────────────────────────────────────────────────────

export type AchievementScope =
  | 'run'          // Something meaningful in a single gate run
  | 'session'      // Something meaningful across the whole session
  | 'longitudinal'; // Something meaningful compared to history

// ── Type ──────────────────────────────────────────────────────────────────────

export type AchievementType =
  | 'pb'            // All-time personal best
  | 'condition-pb'  // Personal best within a specific condition (e.g. wet-track PB)
  | 'milestone'     // Goal milestone reached
  | 'consistency'   // Most consistent session / streak
  | 'progression'   // Longitudinal improvement (e.g. 8% since onboarding)
  | 'resilience'    // Good performance despite challenging conditions or low readiness
  | 'trend';        // Sustained positive trend across multiple sessions

// ── Template ──────────────────────────────────────────────────────────────────
// Controls which card layout is selected by the rendering engine.

export type CardTemplate =
  | 'pb'          // Bold metric display — PBs and condition PBs
  | 'milestone'   // Goal progress arc — milestone completions
  | 'progression' // Trend line — longitudinal improvement snapshots
  | 'consistency' // Consistency badge — low CV, steady sessions
  | 'resilience'; // Context-forward — performance despite adversity

// ── Privacy ───────────────────────────────────────────────────────────────────

export type PrivacyMode =
  | 'private'     // Generated but not shareable — for internal use only
  | 'club'        // Shareable within club/team only
  | 'anonymous'   // Shareable publicly but rider name anonymised
  | 'public';     // Fully shareable with display name

// ── Sensitivity ───────────────────────────────────────────────────────────────

export type SensitivityLevel =
  | 'public-safe'  // Milestones, PBs, progression, consistency
  | 'private'      // Anything involving fatigue, readiness, or negative signals
  | 'coach-only';  // Diagnostic information

// ── Suppression reason ────────────────────────────────────────────────────────
// Why an achievement was not generated or was suppressed.
// Used for debugging and for the "nothing to celebrate yet" state.

export type SuppressionReason =
  | 'low-confidence'        // Fewer than 3 stat-eligible runs
  | 'invalid-telemetry'     // Calibration failure or blocked metrics
  | 'testing-session'       // Session focus was testing or technique
  | 'recovery-session'      // Session focus was recovery — not for comparison
  | 'incomplete-session'    // Warmup-only or too few runs
  | 'insufficient-history'  // Not enough longitudinal data for the claim
  | 'no-meaningful-event'   // Everything computed, nothing worth celebrating
  | 'data-quality-unknown'  // Unknown calibration state
  | 'condition-pb-insufficient-data'; // < 3 sessions in this condition

// ── Context ───────────────────────────────────────────────────────────────────
// The environmental and rider state context that makes the achievement meaningful.
// Carried on every achievement so the card can contextualise appropriately.

export interface AchievementContext {
  weatherCondition: string | null;
  trackSurface: string | null;
  sessionFocus: string | null;
  rideFeel: string | null;
  isChallengingConditions: boolean;  // wet/muddy/rain/windy/cold
  isLowReadiness: boolean;           // rideFeel === 'off'
  isHighReadiness: boolean;          // rideFeel === 'dialled' | 'peak'
}

// ── Primary metric ────────────────────────────────────────────────────────────
// The single number that is the heart of the achievement.

export interface AchievementMetric {
  label: string;          // e.g. 'Reaction Time', 'Peak Speed'
  value: string;          // Formatted display value e.g. '0.182'
  unit: string;           // e.g. 's', ' km/h', 'G'
  rawValue: number;       // Unformatted for comparisons
  previousValue?: number; // For progression/improvement achievements
  improvementPercent?: number; // e.g. 8.3 (positive = better)
  improvementDisplay?: string; // e.g. '8% faster', '+2.1 km/h'
}

// ── The achievement ───────────────────────────────────────────────────────────

export interface ShareableAchievement {
  // Identity
  id: string;
  sessionId: string;
  riderId: string;

  // Classification
  scope: AchievementScope;
  type: AchievementType;
  template: CardTemplate;

  // Content — what happened and why it matters
  title: string;           // Short, card-ready headline e.g. 'New Personal Best'
  subtitle: string;        // One line of context e.g. 'Fastest reaction time ever recorded'
  contextLine: string | null; // Conditions/feel context e.g. 'Despite wet track and low readiness'
  narrativeNote: string | null; // Optional coaching observation for detail view

  // Metric
  metric: AchievementMetric;

  // Context
  context: AchievementContext;

  // Validity
  confidence: 'low' | 'moderate' | 'high';
  sensitivity: SensitivityLevel;
  isShareable: boolean;    // true only when confidence ≥ moderate AND sensitivity = public-safe

  // Privacy
  privacyMode: PrivacyMode;
  riderDisplayName: string; // Anonymised if privacyMode is anonymous

  // Timestamps
  sessionDate: string;
  createdAt: string;
}

// ── Detection input ───────────────────────────────────────────────────────────
// Everything the achievement detector needs in one place.
// Assembled by the session page from existing data — no new DB queries.

export interface AchievementDetectorInput {
  // Identity
  sessionId: string;
  riderId: string;
  riderDisplayName: string;
  sessionDate: string;

  // Session performance
  sessionStats: {
    run_count: number;
    included_run_count: number;
    best_reaction_ms: number | null;
    avg_reaction_ms: number | null;
    reaction_cv: number | null;
    best_peak_speed_ms: number | null;
    best_max_g: number | null;
    has_valid_speed: boolean;
  };

  // All-time personal bests (before this session)
  allTimePBs: {
    bestReactionMs: number | null;
    bestSpeedMs: number | null;
    bestMaxG: number | null;
  };

  // Goal progress this session
  goalProgress: Array<{
    goalId: string;
    metric: string;
    metricLabel: string;
    improvement: string;
    percentToGoal: number;
    isSignificant: boolean;
    newValue?: number | null;
  }> | null;

  // Session context
  context: AchievementContext;

  // Data quality
  dataQualityRating: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null;
  analyticsValid: boolean;
  hasCalibrationWarning: boolean;

  // Longitudinal — from cross-session intelligence (optional, null when < 3 sessions)
  longitudinal: {
    sessionCount: number;
    overallTrend: string;
    reactionTrend: { direction: string; changePercent: number | null; improving: boolean };
    consistencyTrend: { direction: string; improving: boolean };
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

  // Privacy preference
  privacyMode: PrivacyMode;
}

// ── Detection result ──────────────────────────────────────────────────────────

export interface AchievementDetectionResult {
  // The strongest achievement found, or null if nothing meaningful
  achievement: ShareableAchievement | null;

  // All candidates evaluated (including suppressed ones)
  // Useful for debugging and for "coming soon" UI states
  candidates: Array<{
    type: AchievementType;
    scope: AchievementScope;
    suppressed: boolean;
    suppressionReason?: SuppressionReason;
    score: number; // Internal ranking score — higher = stronger achievement
  }>;

  // Why nothing was generated (when achievement is null)
  suppressionReason: SuppressionReason | null;
}
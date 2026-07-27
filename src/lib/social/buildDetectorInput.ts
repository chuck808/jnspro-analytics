/**
 * Social Layer — Detector Input Builder v2
 *
 * Assembles AchievementDetectorInput from data already available on the
 * session page via Svelte context. No additional DB queries.
 *
 * Called as a $derived block on the session page after performanceAnalysis
 * and intelligence are computed.
 */

import type { AchievementDetectorInput, AchievementContext, PrivacyMode } from './types';

interface SessionPageData {
  session: {
    id: string;
    timestamp: string;
    weather_conditions?: string | null;
    track_surface?: string | null;
    session_focus?: string | null;
    ride_feel?: string | null;
  };
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
  allTimePBs: {
    bestReactionMs: number | null;
    bestSpeedMs: number | null;
    bestMaxG: number | null;
    // Extended — may not be present in older versions
    bestConsistencyCv?: number | null;
    bestSessionQuality?: number | null;
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
  profile: {
    id: string;
    name?: string | null;
    display_name?: string | null;
    leaderboard_display_name?: string | null;
  } | null;
  // From cross-session report (may be null if < 3 sessions)
  crossSessionReport?: any | null;
  // From performanceAnalysis.intelligence
  intelligence?: {
    sessionQuality?: number | null;
    repeatability?: {
      overall?: number | null;
      cvPercent?: number | null;
      label?: string | null;
    } | null;
    bestVsAvg?: { gapPercent?: number | null } | null;
    dropOff?: { dropOffRun?: number | null } | null;
    setLength?: { optimal?: number | null } | null;
    fatigue?: { trend?: string | null } | null;
  } | null;
  // From scoreRunTechnique
  techniqueScores?: {
    launchQuality?: number | null;
    explosiveness?: number | null;
    speedCarry?: number | null;
    smoothness?: number | null;
    repeatability?: number | null;
  } | null;
  // From physics impulse
  impulse?: {
    totalImpulseNs?: number;
    timeToHalfImpulseS?: number;
    frontLoadedScore?: number;
    impulseEfficiency?: number;
  } | null;
  // From buildPerformanceInsightPack
  insightPack?: {
    strengths?: string[];
    limiters?: string[];
  } | null;
  hasCalibrationWarning?: boolean;
  dataQualityRating?: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null;
  // Rider profile context
  riderLevel?: string | null;
  // getUCICategory() return shape — { name, ... }, not a plain string
  uciCategory?: { name: string } | null;
}

export function buildDetectorInput(
  data: SessionPageData,
  privacyMode: PrivacyMode = 'private'
): AchievementDetectorInput {
  const session = data.session;

  // ── Context ───────────────────────────────────────────────────────────────
  const weatherCondition = (session as any).weather_conditions ?? null;
  const trackSurface     = (session as any).track_surface     ?? null;
  const sessionFocus     = (session as any).session_focus     ?? null;
  const rideFeel         = (session as any).ride_feel         ?? null;

  const isChallengingConditions =
    trackSurface === 'wet' || trackSurface === 'muddy' || trackSurface === 'damp' ||
    weatherCondition === 'rain' || weatherCondition === 'light-rain' ||
    weatherCondition === 'windy' || weatherCondition === 'cold';

  const context: AchievementContext = {
    weatherCondition,
    trackSurface,
    sessionFocus,
    rideFeel,
    isChallengingConditions,
    isLowReadiness:  rideFeel === 'off',
    isHighReadiness: rideFeel === 'dialled' || rideFeel === 'peak',
  };

  // ── Display name ──────────────────────────────────────────────────────────
  const profile = data.profile;
  const riderDisplayName =
    profile?.leaderboard_display_name ??
    profile?.name ??
    profile?.display_name ??
    'Rider';

  // ── Rider class ───────────────────────────────────────────────────────────
  const riderClass = data.uciCategory?.name ?? null;

  // ── Intelligence ──────────────────────────────────────────────────────────
  const intel = data.intelligence;
  const intelligence: AchievementDetectorInput['intelligence'] = {
    sessionQuality:     intel?.sessionQuality     ?? null,
    repeatabilityScore: intel?.repeatability?.overall  ?? null,
    repeatabilityCv:    intel?.repeatability?.cvPercent ?? null,
    repeatabilityLabel: intel?.repeatability?.label    ?? null,
    bestVsAvgGapPercent: intel?.bestVsAvg?.gapPercent ?? null,
    dropOffRun:         intel?.dropOff?.dropOffRun     ?? null,
    optimalSetLength:   intel?.setLength?.optimal      ?? null,
    fatigueTrend:       (intel?.fatigue?.trend === 'stable' || intel?.fatigue?.trend === 'declining')
                          ? intel.fatigue.trend : null,
  };

  // ── Technique scores ──────────────────────────────────────────────────────
  const ts = data.techniqueScores;
  const techniqueScores = ts ? {
    launchQuality: ts.launchQuality  ?? null,
    explosiveness: ts.explosiveness  ?? null,
    speedCarry:    ts.speedCarry     ?? null,
    smoothness:    ts.smoothness     ?? null,
    repeatability: ts.repeatability  ?? null,
  } : null;

  // ── Impulse ───────────────────────────────────────────────────────────────
  const imp = data.impulse;
  const impulse = (imp?.totalImpulseNs != null) ? {
    totalImpulseNs:     imp.totalImpulseNs!,
    timeToHalfImpulseS: imp.timeToHalfImpulseS ?? 0,
    frontLoadedScore:   imp.frontLoadedScore    ?? 0,
    impulseEfficiency:  imp.impulseEfficiency   ?? 0,
  } : null;

  // ── Insight pack ──────────────────────────────────────────────────────────
  const ip = data.insightPack;
  const insightPack = ip ? {
    strengths: ip.strengths ?? [],
    limiters:  ip.limiters  ?? [],
  } : null;

  // ── Cross-session longitudinal ────────────────────────────────────────────
  const csr = data.crossSessionReport;
  const longitudinal = csr ? {
    sessionCount: csr.sessionCount ?? 0,
    overallTrend: csr.overallTrend ?? 'unknown',
    reactionTrend: {
      direction:     csr.performance?.reactionTrend?.direction     ?? 'unknown',
      changePercent: csr.performance?.reactionTrend?.changePercent ?? null,
      improving:     csr.performance?.reactionTrend?.improving     ?? false,
    },
    consistencyTrend: {
      direction: csr.consistency?.repeatabilityTrend?.direction ?? 'unknown',
      improving: csr.consistency?.repeatabilityTrend?.improving ?? false,
    },
    contextualPatterns: csr.contextualPatterns ?? null,
  } : null;

  // ── Extended all-time PBs ─────────────────────────────────────────────────
  // bestConsistencyCv and bestSessionQuality come from the allTimePBs query.
  // If not present (older code path), default to null so the detector
  // handles them gracefully.
  const allTimePBs: AchievementDetectorInput['allTimePBs'] = {
    bestReactionMs:    data.allTimePBs.bestReactionMs,
    bestSpeedMs:       data.allTimePBs.bestSpeedMs,
    bestMaxG:          data.allTimePBs.bestMaxG,
    bestConsistencyCv: data.allTimePBs.bestConsistencyCv ?? null,
    bestSessionQuality: data.allTimePBs.bestSessionQuality ?? null,
  };

  return {
    sessionId:        session.id,
    riderId:          profile?.id ?? '',
    riderDisplayName,
    riderClass,
    sessionDate:      session.timestamp,
    sessionStats:     data.sessionStats as AchievementDetectorInput['sessionStats'],
    intelligence,
    techniqueScores,
    impulse,
    insightPack,
    allTimePBs,
    goalProgress:     data.goalProgress ?? null,
    context,
    dataQualityRating:    data.dataQualityRating ?? null,
    analyticsValid:       !(data.hasCalibrationWarning ?? false),
    hasCalibrationWarning: data.hasCalibrationWarning ?? false,
    longitudinal,
    privacyMode,
  };
}

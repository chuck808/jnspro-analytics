/**
 * Performance Engine v8.0 — Cross-Session Intelligence Types
 */

export interface SessionPerformanceSummary {
  sessionId: string;
  date: string | Date;
  runCount: number;

  // v7.2 session intelligence outputs
  sessionQuality: number | null;
  repeatabilityScore: number | null;
  bestVsAvgGapPercent: number | null;
  dropOffRun: number | null;
  optimalSetLength: number | null;

  // Performance metrics
  bestSpeedKmh: number | null;
  avgSpeedKmh: number | null;
  bestReactionTimeSec: number | null;
  avgReactionTimeSec: number | null;
  peakG: number | null;
  avgPeakG: number | null;
}

export type TrendDirection = 'up' | 'down' | 'stable' | 'unknown';
export type ConfidenceLevel = 'low' | 'moderate' | 'high';
export type OverallTrend = 'improving' | 'stable' | 'declining' | 'mixed' | 'unknown';

export interface TrendResult {
  direction: TrendDirection;
  change: number | null;
  changePercent: number | null;
  recent: number | null;
  historical: number | null;
  improving: boolean;
}

export interface PerformanceProgression {
  speedTrend: TrendResult;
  reactionTrend: TrendResult;
  peakGTrend: TrendResult;
}

export interface ConsistencyTrends {
  repeatabilityTrend: TrendResult;
  bestVsAverageGapTrend: TrendResult;
}

export interface FatigueProgression {
  dropOffTrend: TrendResult;
  optimalSetLengthTrend: TrendResult;
}

export interface CrossSessionReport {
  status: 'insufficient-data' | 'ready';
  sessionCount: number;
  lookbackSessions: number;
  confidence: ConfidenceLevel;
  overallTrend: OverallTrend;

  performance: PerformanceProgression;
  consistency: ConsistencyTrends;
  fatigue: FatigueProgression;

  warnings: string[];
  recommendations: string[];
  headline: string;
}

export interface CrossSessionOptions {
  minSessions?: number;
  lookbackSessions?: number;
}

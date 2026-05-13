/**
 * v8.3 Controlled Language System - Types
 * 
 * Consistent coaching language without AI
 */

export type ConfidenceLevel = 'low' | 'moderate' | 'high';
export type Priority = 'critical' | 'important' | 'watch' | 'info';
export type MetricStatus = 'trusted' | 'caution' | 'blocked';

export interface CoachMessage {
  headline: string;
  impact: string;
  whyThisMatters: string;
  action: string;
  watchFor: string | null;
  confidence: ConfidenceLevel;
  priority: Priority;
}

export interface TrustContext {
  confidence: ConfidenceLevel;
  basedOnRuns: number;
  trustedMetrics: string[];
  cautionMetrics: string[];
  blockedMetrics: string[];
}

export interface SessionNarrative {
  message: CoachMessage;
  trust: TrustContext;
  warnings: string[];
}

export interface PhraseOptions {
  runCount?: number;
  value?: number;
  metric?: string;
  context?: string;
}

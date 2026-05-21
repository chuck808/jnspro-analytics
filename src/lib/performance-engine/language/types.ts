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
  // Explicit marker so the report engine can prefer this headline over the
  // sessionQualityHeadline fallback without resorting to a word-in-string check.
  // Always true for messages produced by buildSessionNarrative — never set it
  // on ad-hoc CoachMessage objects constructed in UI/report code where the
  // caller controls the headline directly.
  isCoachingHeadline: true;
}

export interface TrustContext {
  confidence: ConfidenceLevel;
  basedOnRuns: number;
  excludedRuns?: number;
  excludedReasons?: string[];
  trustedMetrics: string[];
  cautionMetrics: string[];
  blockedMetrics: string[];
}

export interface SessionNarrative {
  message: CoachMessage;
  trust: TrustContext;
  warnings: string[];
  // Context notes assembled from rideFeel, sessionFocus, conditions, and
  // correlation hints. Rendered as a second paragraph after the primary
  // message. Empty when no context was set or nothing meaningful to say.
  contextNotes?: string[];
}

export interface PhraseOptions {
  runCount?: number;
  value?: number;
  metric?: string;
  context?: string;
}
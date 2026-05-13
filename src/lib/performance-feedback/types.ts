/**
 * Performance Engine v8.1 — Feedback Types
 * 
 * Types for capturing user feedback on insights
 */

export type InsightType =
  | 'cross-session-headline'
  | 'cross-session-recommendation'
  | 'cross-session-warning'
  | 'session-intelligence'
  | 'technique-score';

export type FeedbackResponse = 'useful' | 'not-useful' | 'confusing' | 'ignored';

export type DetailLevel = 'grom' | 'rider' | 'elite' | 'coach';

export interface InsightFeedbackPayload {
  insightType: InsightType;
  content: string;
  response: FeedbackResponse;
  timestamp: string;
  
  // Context
  detailLevel?: DetailLevel;
  sessionId?: string;
  riderId?: string;
  
  // Additional context (optional, flexible)
  context?: Record<string, any>;
  
  // Optional user comment
  comment?: string;
}

export interface FeedbackSubmissionResult {
  success: boolean;
  message?: string;
  feedbackId?: string;
}

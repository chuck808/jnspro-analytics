/**
 * Performance Engine v8.1 — Insight Feedback Helpers
 * 
 * Functions for building and submitting feedback payloads
 */

import type {
  InsightFeedbackPayload,
  FeedbackSubmissionResult,
  InsightType,
  FeedbackResponse,
  DetailLevel
} from './types';

interface BuildFeedbackOptions {
  insightType: InsightType;
  content: string;
  response: FeedbackResponse;
  detailLevel?: DetailLevel;
  sessionId?: string;
  riderId?: string;
  context?: Record<string, any>;
  comment?: string;
}

/**
 * Build a feedback payload ready for submission
 */
export function buildInsightFeedbackPayload(options: BuildFeedbackOptions): InsightFeedbackPayload {
  return {
    insightType: options.insightType,
    content: options.content,
    response: options.response,
    timestamp: new Date().toISOString(),
    detailLevel: options.detailLevel,
    sessionId: options.sessionId,
    riderId: options.riderId,
    context: options.context,
    comment: options.comment
  };
}

/**
 * Submit feedback to your API endpoint
 * 
 * @param payload - The feedback payload
 * @param endpoint - Your feedback API endpoint (default: '/api/feedback/insights')
 * @returns Promise with submission result
 */
export async function sendInsightFeedback(
  payload: InsightFeedbackPayload,
  endpoint: string = '/api/feedback/insights'
): Promise<FeedbackSubmissionResult> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Server responded with status ${response.status}`
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      feedbackId: result.id || result.feedbackId,
      message: result.message
    };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Build feedback for a cross-session headline
 */
export function buildHeadlineFeedback(
  headline: string,
  response: FeedbackResponse,
  options: {
    detailLevel?: DetailLevel;
    riderId?: string;
    context?: Record<string, any>;
  } = {}
): InsightFeedbackPayload {
  return buildInsightFeedbackPayload({
    insightType: 'cross-session-headline',
    content: headline,
    response,
    ...options
  });
}

/**
 * Build feedback for a recommendation
 */
export function buildRecommendationFeedback(
  recommendation: string,
  response: FeedbackResponse,
  options: {
    detailLevel?: DetailLevel;
    riderId?: string;
    sessionId?: string;
    context?: Record<string, any>;
  } = {}
): InsightFeedbackPayload {
  return buildInsightFeedbackPayload({
    insightType: 'cross-session-recommendation',
    content: recommendation,
    response,
    ...options
  });
}

/**
 * Build feedback for a warning
 */
export function buildWarningFeedback(
  warning: string,
  response: FeedbackResponse,
  options: {
    detailLevel?: DetailLevel;
    riderId?: string;
    context?: Record<string, any>;
  } = {}
): InsightFeedbackPayload {
  return buildInsightFeedbackPayload({
    insightType: 'cross-session-warning',
    content: warning,
    response,
    ...options
  });
}

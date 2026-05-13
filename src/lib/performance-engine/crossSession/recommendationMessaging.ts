/**
 * Performance Engine v8.1 — Enhanced Recommendation Messaging
 * 
 * Builds recommendations with reasons and priority
 */

import type { CrossSessionReport, OverallTrend } from './types';

export interface EnhancedRecommendation {
  text: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  category: 'training' | 'recovery' | 'technique' | 'capacity' | 'general';
}

export function buildEnhancedRecommendations(report: CrossSessionReport): EnhancedRecommendation[] {
  if (report.status === 'insufficient-data') {
    return [
      {
        text: 'Log 3+ sessions to unlock personalized recommendations',
        reason: 'Cross-session trends require multiple data points to identify patterns',
        priority: 'low',
        category: 'general'
      }
    ];
  }

  const recommendations: EnhancedRecommendation[] = [];

  // Overall trend recommendations
  if (report.overallTrend === 'improving') {
    recommendations.push({
      text: 'Continue your current training approach',
      reason: 'Your metrics are trending positively across multiple areas',
      priority: 'low',
      category: 'general'
    });
  }

  if (report.overallTrend === 'declining') {
    recommendations.push({
      text: 'Review your training volume and recovery schedule',
      reason: 'Multiple metrics are declining, suggesting overtraining or inadequate recovery',
      priority: 'high',
      category: 'recovery'
    });
  }

  // Consistency-focused recommendations
  const repeatabilityDecline = !report.consistency.repeatabilityTrend.improving && 
    report.consistency.repeatabilityTrend.direction !== 'stable';

  if (repeatabilityDecline) {
    recommendations.push({
      text: 'Focus on repeatable execution over peak performance',
      reason: 'Your consistency is declining while chasing faster times',
      priority: 'high',
      category: 'technique'
    });

    recommendations.push({
      text: 'Add technique-focused sessions with submaximal intensity',
      reason: 'Practicing at 80-85% effort builds motor patterns without fatigue',
      priority: 'medium',
      category: 'technique'
    });
  }

  // Fatigue and capacity recommendations
  const capacityDecline = !report.fatigue.optimalSetLengthTrend.improving && 
    report.fatigue.optimalSetLengthTrend.direction === 'down';

  if (capacityDecline) {
    recommendations.push({
      text: 'Increase recovery time between sessions',
      reason: 'Your optimal set length is decreasing, indicating accumulated fatigue',
      priority: 'high',
      category: 'recovery'
    });

    recommendations.push({
      text: 'Consider a deload week with reduced volume',
      reason: 'A temporary reduction in training load helps your body adapt and recover',
      priority: 'medium',
      category: 'recovery'
    });
  }

  // Reaction time recommendations
  const reactionDecline = report.performance.reactionTrend.direction === 'up' && 
    !report.performance.reactionTrend.improving;

  if (reactionDecline) {
    recommendations.push({
      text: 'Add reaction-specific drills to your warm-up',
      reason: 'Your reaction times are slowing, which impacts overall performance',
      priority: 'medium',
      category: 'training'
    });
  }

  // Best vs Average gap recommendations
  const gapWidening = report.consistency.bestVsAverageGapTrend.direction === 'up' && 
    !report.consistency.bestVsAverageGapTrend.improving;

  if (gapWidening) {
    recommendations.push({
      text: 'Work on raising your average performance',
      reason: 'The gap between your best and average runs is widening',
      priority: 'medium',
      category: 'training'
    });
  }

  // Excellent progress recommendation
  const speedUp = report.performance.speedTrend.improving;
  const consistencyUp = report.consistency.repeatabilityTrend.improving;

  if (speedUp && consistencyUp && report.overallTrend === 'improving') {
    recommendations.push({
      text: 'Excellent progress - maintain this approach',
      reason: 'You\'re improving both speed and consistency simultaneously',
      priority: 'low',
      category: 'general'
    });
  }

  // Capacity building (when fatigue is good but could be better)
  if (report.fatigue.optimalSetLengthTrend.direction === 'stable' && 
      report.overallTrend === 'improving') {
    recommendations.push({
      text: 'Gradually increase session volume to build capacity',
      reason: 'Your recovery is adequate - you have room to increase training load',
      priority: 'low',
      category: 'capacity'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit to top 5 to avoid overwhelming users
  return recommendations.slice(0, 5);
}

/**
 * Get recommendations filtered by category
 */
export function getRecommendationsByCategory(
  recommendations: EnhancedRecommendation[],
  category: EnhancedRecommendation['category']
): EnhancedRecommendation[] {
  return recommendations.filter(r => r.category === category);
}

/**
 * Get top priority recommendations
 */
export function getTopPriorityRecommendations(
  recommendations: EnhancedRecommendation[],
  limit: number = 3
): EnhancedRecommendation[] {
  return recommendations
    .filter(r => r.priority === 'high' || r.priority === 'medium')
    .slice(0, limit);
}

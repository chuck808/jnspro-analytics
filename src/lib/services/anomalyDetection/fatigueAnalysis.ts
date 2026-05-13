/**
 * Fatigue Pattern Recognition
 * 
 * Detects signs of overtraining, fatigue accumulation, and declining performance trends.
 * Recommends rest periods based on detected patterns.
 */

import type { Severity } from './outlierDetection';

export interface FatigueIndicator {
    type: 'declining_trend' | 'reduced_consistency' | 'increased_recovery_time' | 'training_load_spike';
    severity: Severity;
    description: string;
    recommendation: string;
    confidence: number; // 0-1
}

export interface FatigueAssessment {
    fatigueScore: number; // 0-100, higher = more fatigued
    indicators: FatigueIndicator[];
    recommendedAction: 'continue' | 'reduce_intensity' | 'rest_day' | 'extended_rest';
    daysUntilNextSession: number;
}

interface SessionData {
    sessionId: string;
    timestamp: string;
    bestValue: number;       // Best performance in session
    avgValue: number;        // Average performance
    consistency: number;     // CV or similar metric
    sessionDuration?: number; // Optional
}

/**
 * Analyze fatigue from recent session data
 * @param sessions Recent sessions (chronological order)
 * @param metric Metric name
 * @param lowerIsBetter True for metrics like reaction time
 * @returns Comprehensive fatigue assessment
 */
export function analyzeFatigue(
    sessions: SessionData[],
    metric: string,
    lowerIsBetter: boolean
): FatigueAssessment {
    if (sessions.length < 3) {
        return {
            fatigueScore: 0,
            indicators: [],
            recommendedAction: 'continue',
            daysUntilNextSession: 1
        };
    }

    const indicators: FatigueIndicator[] = [];
    let fatigueScore = 0;

    // 1. Check for declining performance trend
    const trendIndicator = detectDecliningTrend(sessions, metric, lowerIsBetter);
    if (trendIndicator) {
        indicators.push(trendIndicator);
        fatigueScore += trendIndicator.severity === 'critical' ? 40 : 
                        trendIndicator.severity === 'warning' ? 25 : 10;
    }

    // 2. Check for reduced consistency
    const consistencyIndicator = detectReducedConsistency(sessions, metric);
    if (consistencyIndicator) {
        indicators.push(consistencyIndicator);
        fatigueScore += consistencyIndicator.severity === 'warning' ? 20 : 10;
    }

    // 3. Check training frequency/load
    const loadIndicator = detectTrainingLoad(sessions);
    if (loadIndicator) {
        indicators.push(loadIndicator);
        fatigueScore += loadIndicator.severity === 'warning' ? 15 : 5;
    }

    // 4. Check recent performance drop
    const recentDropIndicator = detectRecentPerformanceDrop(sessions, metric, lowerIsBetter);
    if (recentDropIndicator) {
        indicators.push(recentDropIndicator);
        fatigueScore += recentDropIndicator.severity === 'critical' ? 30 : 15;
    }

    // Determine recommended action
    const { action, daysRest } = determineAction(fatigueScore, indicators);

    return {
        fatigueScore: Math.min(100, fatigueScore),
        indicators,
        recommendedAction: action,
        daysUntilNextSession: daysRest
    };
}

/**
 * Detect declining performance trend over recent sessions
 */
function detectDecliningTrend(
    sessions: SessionData[],
    metric: string,
    lowerIsBetter: boolean
): FatigueIndicator | null {
    if (sessions.length < 4) return null;

    // Look at last 5 sessions (or all if less)
    const window = sessions.slice(-Math.min(5, sessions.length));
    const values = window.map(s => s.bestValue);

    // Simple linear regression to detect trend
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Normalize slope by average value
    const avgValue = sumY / n;
    const normalizedSlope = slope / avgValue;

    // Check if trend is declining (worse)
    const isDeclining = lowerIsBetter 
        ? normalizedSlope > 0.02  // Values increasing (worse)
        : normalizedSlope < -0.02; // Values decreasing (worse)

    if (isDeclining) {
        const severity: Severity = Math.abs(normalizedSlope) > 0.05 ? 'critical' :
                                    Math.abs(normalizedSlope) > 0.03 ? 'warning' : 'info';

        return {
            type: 'declining_trend',
            severity,
            description: `${metric} has been declining over the last ${n} sessions`,
            recommendation: 'Performance trending downward - this may indicate accumulated fatigue. Consider a rest day.',
            confidence: 0.7
        };
    }

    return null;
}

/**
 * Detect reduced consistency (increasing variability)
 */
function detectReducedConsistency(
    sessions: SessionData[],
    metric: string
): FatigueIndicator | null {
    if (sessions.length < 5) return null;

    // Compare recent consistency to earlier consistency
    const recent = sessions.slice(-3);
    const earlier = sessions.slice(-6, -3);

    if (earlier.length < 3) return null;

    const recentAvgCV = recent.reduce((sum, s) => sum + s.consistency, 0) / recent.length;
    const earlierAvgCV = earlier.reduce((sum, s) => sum + s.consistency, 0) / earlier.length;

    // Check if consistency has worsened significantly
    const increase = recentAvgCV - earlierAvgCV;
    const percentIncrease = (increase / earlierAvgCV) * 100;

    if (percentIncrease > 30) { // 30% worse consistency
        const severity: Severity = percentIncrease > 50 ? 'warning' : 'info';

        return {
            type: 'reduced_consistency',
            severity,
            description: `Consistency in ${metric} has decreased by ${percentIncrease.toFixed(0)}%`,
            recommendation: 'Increasing variability may indicate fatigue or focus issues. Ensure adequate recovery between sessions.',
            confidence: 0.6
        };
    }

    return null;
}

/**
 * Detect high training load or frequency
 */
function detectTrainingLoad(sessions: SessionData[]): FatigueIndicator | null {
    if (sessions.length < 3) return null;

    // Check last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = sessions.filter(s => new Date(s.timestamp) >= sevenDaysAgo);

    // High frequency flag
    if (recentSessions.length >= 5) {
        return {
            type: 'training_load_spike',
            severity: 'warning',
            description: `${recentSessions.length} sessions in the last 7 days`,
            recommendation: 'High training frequency detected. Ensure you\'re allowing adequate recovery time between sessions.',
            confidence: 0.8
        };
    }

    // Check for consecutive days
    const dates = sessions.slice(-4).map(s => new Date(s.timestamp).toDateString());
    const uniqueDates = new Set(dates);
    const consecutiveDays = dates.length - uniqueDates.size + 1;

    if (consecutiveDays >= 3) {
        return {
            type: 'training_load_spike',
            severity: 'info',
            description: `Training on ${consecutiveDays} consecutive days`,
            recommendation: 'Consider taking a rest day to allow for recovery.',
            confidence: 0.7
        };
    }

    return null;
}

/**
 * Detect recent performance drop
 */
function detectRecentPerformanceDrop(
    sessions: SessionData[],
    metric: string,
    lowerIsBetter: boolean
): FatigueIndicator | null {
    if (sessions.length < 3) return null;

    const latest = sessions[sessions.length - 1];
    const previousAvg = sessions.slice(-4, -1).reduce((sum, s) => sum + s.avgValue, 0) / Math.min(3, sessions.length - 1);

    const drop = latest.avgValue - previousAvg;
    const percentDrop = Math.abs(drop / previousAvg) * 100;

    const isWorsening = lowerIsBetter ? drop > 0 : drop < 0;

    if (isWorsening && percentDrop > 10) {
        const severity: Severity = percentDrop > 20 ? 'critical' : 'warning';

        return {
            type: 'declining_trend',
            severity,
            description: `Latest ${metric} is ${percentDrop.toFixed(1)}% worse than recent average`,
            recommendation: severity === 'critical' 
                ? 'Significant performance drop. Take 2-3 rest days before next session.'
                : 'Performance dropped noticeably. Consider a lighter session or rest day.',
            confidence: 0.8
        };
    }

    return null;
}

/**
 * Determine recommended action based on fatigue score and indicators
 */
function determineAction(
    fatigueScore: number,
    indicators: FatigueIndicator[]
): { action: FatigueAssessment['recommendedAction']; daysRest: number } {
    const hasCritical = indicators.some(i => i.severity === 'critical');
    const warningCount = indicators.filter(i => i.severity === 'warning').length;

    if (fatigueScore >= 70 || hasCritical) {
        return { action: 'extended_rest', daysRest: 3 };
    }

    if (fatigueScore >= 50 || warningCount >= 2) {
        return { action: 'rest_day', daysRest: 2 };
    }

    if (fatigueScore >= 30) {
        return { action: 'reduce_intensity', daysRest: 1 };
    }

    return { action: 'continue', daysRest: 1 };
}

/**
 * Get user-friendly explanation of fatigue assessment
 */
export function explainFatigueAssessment(assessment: FatigueAssessment): string {
    if (assessment.fatigueScore < 20) {
        return 'You\'re well-recovered and ready to train. No signs of fatigue.';
    }

    if (assessment.fatigueScore < 40) {
        return 'Minor fatigue indicators detected. Continue training but monitor your recovery.';
    }

    if (assessment.fatigueScore < 60) {
        return 'Moderate fatigue detected. Consider reducing training intensity or taking a rest day.';
    }

    if (assessment.fatigueScore < 80) {
        return 'Significant fatigue indicators. A rest day is strongly recommended.';
    }

    return 'High fatigue levels detected. Take 2-3 days of complete rest to recover.';
}

/**
 * Check if user should pause current goals due to fatigue
 */
export function shouldPauseGoals(assessment: FatigueAssessment): boolean {
    return assessment.recommendedAction === 'extended_rest' || 
           assessment.fatigueScore >= 70;
}

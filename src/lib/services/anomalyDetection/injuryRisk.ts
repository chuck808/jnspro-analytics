/**
 * Injury Risk Assessment
 * 
 * Evaluates injury risk based on training patterns, fatigue indicators,
 * and performance anomalies. Provides early warning system for potential issues.
 */

import type { Severity } from './outlierDetection';
import type { FatigueAssessment } from './fatigueAnalysis';
import type { PerformanceAnomaly } from './outlierDetection';

export interface InjuryRiskFactor {
    factor: string;
    severity: Severity;
    description: string;
    preventionTip: string;
}

export interface InjuryRiskAssessment {
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    riskScore: number; // 0-100
    factors: InjuryRiskFactor[];
    immediateAction: string | null;
    preventionRecommendations: string[];
}

interface TrainingPattern {
    consecutiveDays: number;
    weeklySessionCount: number;
    recentIntensitySpike: boolean;
    inadequateRecovery: boolean;
}

/**
 * Assess injury risk based on multiple factors
 */
export function assessInjuryRisk(
    fatigueAssessment: FatigueAssessment,
    anomalies: PerformanceAnomaly[],
    trainingPattern: TrainingPattern
): InjuryRiskAssessment {
    const factors: InjuryRiskFactor[] = [];
    let riskScore = 0;

    // Factor 1: High fatigue is a major injury risk
    if (fatigueAssessment.fatigueScore >= 60) {
        const severity: Severity = fatigueAssessment.fatigueScore >= 80 ? 'critical' : 'warning';
        factors.push({
            factor: 'Accumulated Fatigue',
            severity,
            description: `Fatigue score of ${fatigueAssessment.fatigueScore}/100 indicates high risk of overuse injury`,
            preventionTip: 'Take immediate rest days to allow full recovery before resuming training'
        });
        riskScore += severity === 'critical' ? 40 : 25;
    }

    // Factor 2: Excessive training frequency
    if (trainingPattern.consecutiveDays >= 4) {
        factors.push({
            factor: 'Insufficient Recovery Time',
            severity: 'warning',
            description: `Training ${trainingPattern.consecutiveDays} consecutive days without rest`,
            preventionTip: 'Schedule at least one full rest day every 3-4 training days'
        });
        riskScore += 20;
    }

    if (trainingPattern.weeklySessionCount >= 6) {
        factors.push({
            factor: 'High Training Volume',
            severity: 'warning',
            description: `${trainingPattern.weeklySessionCount} sessions this week is very high`,
            preventionTip: 'Limit training to 4-5 sessions per week to prevent overtraining'
        });
        riskScore += 15;
    }

    // Factor 3: Sudden intensity spike
    if (trainingPattern.recentIntensitySpike) {
        factors.push({
            factor: 'Rapid Training Load Increase',
            severity: 'warning',
            description: 'Training intensity increased too quickly',
            preventionTip: 'Increase training volume gradually (no more than 10% per week)'
        });
        riskScore += 15;
    }

    // Factor 4: Performance anomalies indicating stress
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
        factors.push({
            factor: 'Severe Performance Decline',
            severity: 'critical',
            description: `${criticalAnomalies.length} critical performance anomal${criticalAnomalies.length > 1 ? 'ies' : 'y'} detected`,
            preventionTip: 'Stop training immediately and consult with a coach or medical professional'
        });
        riskScore += 30;
    }

    const warningAnomalies = anomalies.filter(a => a.severity === 'warning');
    if (warningAnomalies.length >= 2) {
        factors.push({
            factor: 'Multiple Performance Issues',
            severity: 'warning',
            description: `${warningAnomalies.length} performance warnings in recent sessions`,
            preventionTip: 'Review training approach and ensure adequate recovery'
        });
        riskScore += 10;
    }

    // Factor 5: Declining consistency (injury warning sign)
    const consistencyIssues = fatigueAssessment.indicators.filter(i => 
        i.type === 'reduced_consistency'
    );
    if (consistencyIssues.length > 0 && consistencyIssues[0].severity !== 'info') {
        factors.push({
            factor: 'Declining Consistency',
            severity: 'info',
            description: 'Increased performance variability may indicate muscle fatigue or compensation',
            preventionTip: 'Focus on technique refinement and ensure proper warm-up and cool-down'
        });
        riskScore += 10;
    }

    // Factor 6: Inadequate recovery between sessions
    if (trainingPattern.inadequateRecovery) {
        factors.push({
            factor: 'Insufficient Recovery',
            severity: 'warning',
            description: 'Not allowing adequate time between training sessions',
            preventionTip: 'Wait at least 48 hours between high-intensity sessions'
        });
        riskScore += 15;
    }

    // Determine risk level and immediate action
    const { riskLevel, immediateAction } = determineRiskLevel(riskScore, factors);
    const preventionRecommendations = generatePreventionRecommendations(factors, riskLevel);

    return {
        riskLevel,
        riskScore: Math.min(100, riskScore),
        factors,
        immediateAction,
        preventionRecommendations
    };
}

/**
 * Determine overall risk level
 */
function determineRiskLevel(
    riskScore: number,
    factors: InjuryRiskFactor[]
): { riskLevel: InjuryRiskAssessment['riskLevel']; immediateAction: string | null } {
    const hasCritical = factors.some(f => f.severity === 'critical');

    if (riskScore >= 70 || hasCritical) {
        return {
            riskLevel: 'critical',
            immediateAction: 'Rest is strongly advised before your next session. Take 3–5 days of complete rest and speak with your coach. If you\'re experiencing pain or persistent fatigue, seek a medical review.'
        };
    }

    if (riskScore >= 50) {
        return {
            riskLevel: 'high',
            immediateAction: 'Take 2–3 rest days before your next session. Monitor for unusual fatigue or soreness and flag it with your coach.'
        };
    }

    if (riskScore >= 30) {
        return {
            riskLevel: 'moderate',
            immediateAction: 'Reduce training intensity by 30-50% for next 1-2 sessions. Focus on recovery.'
        };
    }

    return {
        riskLevel: 'low',
        immediateAction: null
    };
}

/**
 * Generate prevention recommendations based on risk factors
 */
function generatePreventionRecommendations(
    factors: InjuryRiskFactor[],
    riskLevel: InjuryRiskAssessment['riskLevel']
): string[] {
    const recommendations = new Set<string>();

    // Add factor-specific tips
    for (const factor of factors) {
        recommendations.add(factor.preventionTip);
    }

    // Add general recommendations based on risk level
    if (riskLevel === 'critical' || riskLevel === 'high') {
        recommendations.add('Ensure 8+ hours of quality sleep per night');
        recommendations.add('Stay well-hydrated and maintain proper nutrition');
        recommendations.add('Consider active recovery (light stretching, mobility work)');
        recommendations.add('Monitor for pain, unusual soreness, or persistent fatigue');
    }

    if (riskLevel === 'moderate' || riskLevel === 'high') {
        recommendations.add('Incorporate proper warm-up and cool-down routines');
        recommendations.add('Use foam rolling or massage for muscle recovery');
        recommendations.add('Cross-train with low-impact activities');
    }

    if (riskLevel === 'low') {
        recommendations.add('Continue monitoring training load and recovery');
        recommendations.add('Maintain consistent sleep and nutrition habits');
    }

    return Array.from(recommendations);
}

/**
 * Calculate training pattern metrics from session history
 */
export function analyzeTrainingPattern(sessions: Array<{
    timestamp: string;
    runCount: number;
    avgIntensity?: number;
}>): TrainingPattern {
    if (sessions.length < 2) {
        return {
            consecutiveDays: 0,
            weeklySessionCount: 0,
            recentIntensitySpike: false,
            inadequateRecovery: false
        };
    }

    // Consecutive days calculation
    const dates = sessions.map(s => new Date(s.timestamp).toDateString());
    let consecutiveDays = 1;
    let maxConsecutive = 1;
    
    for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            consecutiveDays++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
        } else {
            consecutiveDays = 1;
        }
    }

    // Weekly session count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklySessionCount = sessions.filter(s => 
        new Date(s.timestamp) >= oneWeekAgo
    ).length;

    // Intensity spike detection
    let recentIntensitySpike = false;
    if (sessions.length >= 4) {
        const recentAvgRuns = sessions.slice(-2).reduce((sum, s) => sum + s.runCount, 0) / 2;
        const previousAvgRuns = sessions.slice(-4, -2).reduce((sum, s) => sum + s.runCount, 0) / 2;
        
        const increase = (recentAvgRuns - previousAvgRuns) / previousAvgRuns;
        recentIntensitySpike = increase > 0.30; // 30% increase
    }

    // Inadequate recovery: flag only when sessions are less than 6 hours apart.
    // BMX riders commonly train morning and evening — that's not an overtraining
    // signal. < 6 hours between sessions is genuinely compressed and worth noting.
    let inadequateRecovery = false;
    for (let i = 1; i < sessions.length; i++) {
        const prev = new Date(sessions[i - 1].timestamp);
        const curr = new Date(sessions[i].timestamp);
        const hoursDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 6) {
            inadequateRecovery = true;
            break;
        }
    }

    return {
        consecutiveDays: maxConsecutive,
        weeklySessionCount,
        recentIntensitySpike,
        inadequateRecovery
    };
}

/**
 * Get injury risk color for UI
 */
export function getInjuryRiskColor(riskLevel: InjuryRiskAssessment['riskLevel']): string {
    switch (riskLevel) {
        case 'low': return '#3de8c8';      // Teal
        case 'moderate': return '#f5a623';  // Amber
        case 'high': return '#ff6b3d';      // Orange
        case 'critical': return '#ff4444';  // Red
    }
}

/**
 * Get injury risk emoji for quick visual
 */
export function getInjuryRiskEmoji(riskLevel: InjuryRiskAssessment['riskLevel']): string {
    switch (riskLevel) {
        case 'low': return '✅';
        case 'moderate': return '⚠️';
        case 'high': return '🚨';
        case 'critical': return '🛑';
    }
}
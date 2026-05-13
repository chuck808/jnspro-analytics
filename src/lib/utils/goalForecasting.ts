/**
 * Goal Forecasting & Intelligence
 * 
 * Predicts when goals will be achieved based on performance trends
 * and provides intelligent goal suggestions.
 */

interface Session {
    timestamp: string;
    best_reaction_ms?: number | null;
    best_peak_speed_ms?: number | null;
    best_max_g?: number | null;
}

interface ForecastResult {
    willAchieve: boolean;
    estimatedSessions: number | null;
    estimatedDate: string | null;
    confidence: 'high' | 'medium' | 'low';
    trendDirection: 'improving' | 'stable' | 'declining';
    improvementRate: number; // % per session
    message: string;
}

interface GoalSuggestion {
    metric: string;
    currentValue: number;
    suggestedTarget: number;
    rationale: string;
    timeframe: string; // "achievable in 4-6 weeks"
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Linear regression to calculate trend
 */
function calculateLinearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = values.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R² calculation
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * i + intercept), 2), 0);
    const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, r2 };
}

/**
 * Forecast when a goal will be achieved
 */
export function forecastGoalAchievement(
    sessions: Session[],
    metric: string,
    targetValue: number,
    currentValue: number
): ForecastResult {
    // Extract metric values
    const values: number[] = [];
    sessions.forEach(s => {
        let val: number | null | undefined = null;
        if (metric === 'reactionTime') val = s.best_reaction_ms;
        else if (metric === 'peakSpeed') val = s.best_peak_speed_ms ? s.best_peak_speed_ms * 3.6 : null;
        else if (metric === 'maxG') val = s.best_max_g;
        
        if (val !== null && val !== undefined) values.push(val);
    });

    if (values.length < 3) {
        return {
            willAchieve: false,
            estimatedSessions: null,
            estimatedDate: null,
            confidence: 'low',
            trendDirection: 'stable',
            improvementRate: 0,
            message: 'Need more sessions to forecast (minimum 3)'
        };
    }

    const lowerIsBetter = ['reactionTime', 'elapsedTime', 'accelerationPhase'].includes(metric);
    const regression = calculateLinearRegression(values);

    // Determine trend direction
    let trendDirection: 'improving' | 'stable' | 'declining';
    if (Math.abs(regression.slope) < 0.01) {
        trendDirection = 'stable';
    } else {
        const improving = lowerIsBetter ? regression.slope < 0 : regression.slope > 0;
        trendDirection = improving ? 'improving' : 'declining';
    }

    // Calculate improvement rate (% per session)
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const improvementRate = avgValue > 0 ? (regression.slope / avgValue) * 100 : 0;

    // Confidence based on R²
    let confidence: 'high' | 'medium' | 'low';
    if (regression.r2 > 0.7) confidence = 'high';
    else if (regression.r2 > 0.4) confidence = 'medium';
    else confidence = 'low';

    // Predict when target will be reached
    let estimatedSessions: number | null = null;
    let willAchieve = false;

    if (trendDirection === 'improving' && Math.abs(regression.slope) > 0.001) {
        const currentIndex = values.length - 1;
        const currentPredicted = regression.slope * currentIndex + regression.intercept;
        const diff = targetValue - currentPredicted;
        
        estimatedSessions = Math.ceil(Math.abs(diff / regression.slope));
        
        // Sanity check: reasonable timeframe (1-50 sessions)
        if (estimatedSessions > 0 && estimatedSessions <= 50) {
            willAchieve = true;
        } else {
            estimatedSessions = null;
        }
    }

    // Estimate date (assuming 1 session every 5 days on average)
    let estimatedDate: string | null = null;
    if (estimatedSessions && estimatedSessions > 0) {
        const daysEstimate = estimatedSessions * 5;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysEstimate);
        estimatedDate = futureDate.toISOString();
    }

    // Generate message
    let message = '';
    if (trendDirection === 'declining') {
        message = 'Performance is declining. Focus on fundamentals and recovery.';
    } else if (trendDirection === 'stable') {
        message = 'Performance is stable. Try new training methods to break through plateau.';
    } else if (willAchieve && estimatedSessions) {
        const weeks = Math.ceil((estimatedSessions * 5) / 7);
        message = `On track! Est. ${estimatedSessions} sessions (~${weeks} weeks) to reach goal.`;
    } else if (trendDirection === 'improving') {
        message = 'Improving, but progress is slow. Consider adjusting goal or training intensity.';
    }

    return {
        willAchieve,
        estimatedSessions,
        estimatedDate,
        confidence,
        trendDirection,
        improvementRate,
        message
    };
}

/**
 * Suggest realistic goals based on current performance and trends
 */
export function suggestGoals(sessions: Session[]): GoalSuggestion[] {
    if (sessions.length < 5) return [];

    const suggestions: GoalSuggestion[] = [];

    // Reaction time suggestion
    const reactionValues = sessions
        .map(s => s.best_reaction_ms)
        .filter((v): v is number => v !== null && v !== undefined);
    
    if (reactionValues.length >= 5) {
        const current = reactionValues[reactionValues.length - 1];
        const regression = calculateLinearRegression(reactionValues);
        
        // Suggest 5-10% improvement based on trend
        const improvementFactor = regression.slope < 0 ? 0.93 : 0.95; // More aggressive if already improving
        const suggested = current * improvementFactor;
        
        suggestions.push({
            metric: 'reactionTime',
            currentValue: current,
            suggestedTarget: suggested,
            rationale: regression.slope < 0 
                ? 'You\'re improving! This target maintains your momentum.' 
                : 'Challenging but achievable with focused practice.',
            timeframe: 'achievable in 4-8 weeks',
            confidence: regression.r2 > 0.5 ? 'high' : 'medium'
        });
    }

    // Speed suggestion  
    const speedValues = sessions
        .map(s => s.best_peak_speed_ms ? s.best_peak_speed_ms * 3.6 : null)
        .filter((v): v is number => v !== null && v !== undefined);
    
    if (speedValues.length >= 5) {
        const current = speedValues[speedValues.length - 1];
        const regression = calculateLinearRegression(speedValues);
        
        // Suggest 3-5% improvement
        const improvementFactor = regression.slope > 0 ? 1.05 : 1.03;
        const suggested = current * improvementFactor;
        
        suggestions.push({
            metric: 'peakSpeed',
            currentValue: current,
            suggestedTarget: suggested,
            rationale: regression.slope > 0
                ? 'Building on your speed improvements!'
                : 'Realistic target for speed development.',
            timeframe: 'achievable in 6-10 weeks',
            confidence: regression.r2 > 0.5 ? 'high' : 'medium'
        });
    }

    // Max G suggestion
    const gValues = sessions
        .map(s => s.best_max_g)
        .filter((v): v is number => v !== null && v !== undefined);
    
    if (gValues.length >= 5) {
        const current = gValues[gValues.length - 1];
        const regression = calculateLinearRegression(gValues);
        
        // Suggest 5% improvement
        const suggested = current * 1.05;
        
        suggestions.push({
            metric: 'maxG',
            currentValue: current,
            suggestedTarget: suggested,
            rationale: 'Power improvement through better technique and strength.',
            timeframe: 'achievable in 6-12 weeks',
            confidence: regression.r2 > 0.4 ? 'medium' : 'low'
        });
    }

    return suggestions;
}

/**
 * Calculate goal alignment score (0-100)
 * How well is current training aligned with achieving the goal?
 */
export function calculateGoalAlignment(
    sessions: Session[],
    metric: string,
    targetValue: number,
    currentValue: number
): { score: number; feedback: string } {
    const forecast = forecastGoalAchievement(sessions, metric, targetValue, currentValue);
    
    let score = 50; // Base score
    
    // Trend direction (40 points)
    if (forecast.trendDirection === 'improving') score += 40;
    else if (forecast.trendDirection === 'declining') score -= 30;
    
    // Confidence (20 points)
    if (forecast.confidence === 'high') score += 20;
    else if (forecast.confidence === 'medium') score += 10;
    
    // Will achieve (20 points)
    if (forecast.willAchieve) score += 20;
    
    // Improvement rate (20 points)
    const absRate = Math.abs(forecast.improvementRate);
    if (absRate > 2) score += 20; // Strong improvement
    else if (absRate > 1) score += 10; // Moderate improvement
    
    // Cap at 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Feedback
    let feedback = '';
    if (score >= 80) feedback = '🔥 Excellent! Your training is highly aligned with your goal.';
    else if (score >= 60) feedback = '✅ Good alignment. Stay consistent to reach your goal.';
    else if (score >= 40) feedback = '⚠️ Moderate alignment. Consider adjusting training approach.';
    else feedback = '❌ Poor alignment. Review your training strategy.';
    
    return { score, feedback };
}

/**
 * Confidence Intervals for Goal Predictions
 * 
 * Provides prediction ranges to manage user expectations and account for variability.
 * Uses statistical methods and Monte Carlo simulation for robust estimates.
 */

interface DataPoint {
    x: number;
    y: number;
}

interface PredictionModel {
    predict: (x: number) => number;
    rSquared: number;
}

export interface ConfidenceInterval {
    lower: number;      // Lower bound (e.g., 5 sessions)
    upper: number;      // Upper bound (e.g., 10 sessions)
    median: number;     // Most likely value (e.g., 7 sessions)
    confidence: number; // Confidence level (e.g., 0.80 for 80%)
}

interface PredictionRange {
    sessionsRemaining: ConfidenceInterval;
    targetDate: {
        earliest: Date;
        latest: Date;
        mostLikely: Date;
    };
    confidenceLevel: number;
}

/**
 * Calculate confidence interval for sessions remaining prediction
 * Uses bootstrapping and residual analysis
 */
export function calculateConfidenceInterval(
    dataPoints: DataPoint[],
    model: PredictionModel,
    targetValue: number,
    currentSession: number,
    lowerIsBetter: boolean,
    confidenceLevel: number = 0.80
): ConfidenceInterval | null {
    if (dataPoints.length < 3) {
        return null; // Need minimum data for confidence intervals
    }

    // Calculate residuals
    const residuals: number[] = [];
    for (const point of dataPoints) {
        const predicted = model.predict(point.x);
        residuals.push(point.y - predicted);
    }

    // Calculate standard error of residuals
    const meanResidual = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
    const variance = residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / (residuals.length - 1);
    const stdError = Math.sqrt(variance);

    // Use t-distribution critical value for small samples
    const tValue = getTDistributionValue(confidenceLevel, residuals.length - 1);

    // Predict when target will be reached with uncertainty
    const predictions: number[] = [];
    
    // Monte Carlo simulation: run 1000 trials with noise
    const numSimulations = 1000;
    for (let i = 0; i < numSimulations; i++) {
        // Add random noise based on residual distribution
        const noise = generateNormalRandom() * stdError;
        
        // Find session where target is reached with this noise level
        const sessionsRemaining = predictWithNoise(
            model,
            targetValue,
            currentSession,
            lowerIsBetter,
            noise
        );
        
        if (sessionsRemaining !== null && sessionsRemaining < 100) {
            predictions.push(sessionsRemaining);
        }
    }

    if (predictions.length < 100) {
        return null; // Too many failed predictions, not reliable
    }

    // Sort predictions and extract percentiles
    predictions.sort((a, b) => a - b);
    
    const lowerPercentile = (1 - confidenceLevel) / 2;
    const upperPercentile = 1 - lowerPercentile;
    
    const lowerIndex = Math.floor(predictions.length * lowerPercentile);
    const upperIndex = Math.floor(predictions.length * upperPercentile);
    const medianIndex = Math.floor(predictions.length * 0.5);

    return {
        lower: Math.max(0, Math.ceil(predictions[lowerIndex])),
        upper: Math.ceil(predictions[upperIndex]),
        median: Math.ceil(predictions[medianIndex]),
        confidence: confidenceLevel
    };
}

/**
 * Predict sessions remaining with added noise
 */
function predictWithNoise(
    model: PredictionModel,
    targetValue: number,
    currentSession: number,
    lowerIsBetter: boolean,
    noise: number
): number | null {
    // Binary search for session where (prediction + noise) reaches target
    let low = currentSession;
    let high = currentSession + 100;
    
    const isReached = (prediction: number) => {
        const adjusted = prediction + noise;
        if (lowerIsBetter) {
            return adjusted <= targetValue;
        } else {
            return adjusted >= targetValue;
        }
    };

    // Check if target is reachable
    if (!isReached(model.predict(high))) {
        return null;
    }

    while (high - low > 0.5) {
        const mid = (low + high) / 2;
        const prediction = model.predict(mid);
        
        if (isReached(prediction)) {
            high = mid;
        } else {
            low = mid;
        }
    }

    return Math.ceil(high) - currentSession;
}

/**
 * Generate normally distributed random number (Box-Muller transform)
 */
function generateNormalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Get t-distribution critical value
 * Approximation for common confidence levels
 */
function getTDistributionValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-table for common confidence levels
    const alpha = 1 - confidenceLevel;
    
    if (degreesOfFreedom >= 30) {
        // Use normal distribution approximation for large samples
        if (alpha <= 0.05) return 1.96;  // 95% CI
        if (alpha <= 0.10) return 1.645; // 90% CI
        if (alpha <= 0.20) return 1.282; // 80% CI
        return 1.0;
    }
    
    // Simplified t-values for small samples (conservative estimates)
    if (alpha <= 0.05) {
        if (degreesOfFreedom < 10) return 2.26;
        if (degreesOfFreedom < 20) return 2.09;
        return 2.04;
    }
    
    if (alpha <= 0.10) {
        if (degreesOfFreedom < 10) return 1.83;
        if (degreesOfFreedom < 20) return 1.73;
        return 1.69;
    }
    
    return 1.33; // 80% CI default
}

/**
 * Create full prediction range with dates
 */
export function createPredictionRange(
    confidenceInterval: ConfidenceInterval,
    avgSessionsPerWeek: number = 2
): PredictionRange {
    const today = new Date();
    
    const addSessions = (sessions: number): Date => {
        const weeks = sessions / avgSessionsPerWeek;
        const days = weeks * 7;
        const date = new Date(today);
        date.setDate(date.getDate() + Math.ceil(days));
        return date;
    };

    return {
        sessionsRemaining: confidenceInterval,
        targetDate: {
            earliest: addSessions(confidenceInterval.lower),
            latest: addSessions(confidenceInterval.upper),
            mostLikely: addSessions(confidenceInterval.median)
        },
        confidenceLevel: confidenceInterval.confidence
    };
}

/**
 * Calculate prediction uncertainty score
 * Returns 0-100 where higher means more uncertain
 */
export function calculateUncertaintyScore(
    confidenceInterval: ConfidenceInterval
): number {
    const range = confidenceInterval.upper - confidenceInterval.lower;
    const median = confidenceInterval.median;
    
    if (median === 0) return 100;
    
    // Uncertainty as percentage of prediction range relative to median
    const relativeUncertainty = (range / median) * 100;
    
    // Cap at 100
    return Math.min(100, relativeUncertainty);
}

/**
 * Generate chart data for prediction bands
 * Returns upper and lower bound arrays for Chart.js
 */
export function generatePredictionBands(
    model: PredictionModel,
    dataPoints: DataPoint[],
    futureSession: number,
    confidenceLevel: number = 0.80
): {
    sessions: number[];
    predicted: number[];
    upperBound: number[];
    lowerBound: number[];
} {
    const sessions: number[] = [];
    const predicted: number[] = [];
    const upperBound: number[] = [];
    const lowerBound: number[] = [];

    // Calculate residual standard error
    const residuals = dataPoints.map(p => p.y - model.predict(p.x));
    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / (residuals.length - 1);
    const stdError = Math.sqrt(variance);
    
    const tValue = getTDistributionValue(confidenceLevel, residuals.length - 1);
    const margin = tValue * stdError;

    // Generate points from current to future
    const startSession = Math.min(...dataPoints.map(p => p.x));
    const step = (futureSession - startSession) / 50; // 50 points

    for (let session = startSession; session <= futureSession; session += step) {
        const pred = model.predict(session);
        
        sessions.push(session);
        predicted.push(pred);
        upperBound.push(pred + margin);
        lowerBound.push(pred - margin);
    }

    return { sessions, predicted, upperBound, lowerBound };
}

/**
 * Format confidence interval for display
 */
export function formatConfidenceInterval(ci: ConfidenceInterval): string {
    if (ci.lower === ci.upper) {
        return `${ci.median} session${ci.median !== 1 ? 's' : ''}`;
    }
    
    return `${ci.lower}-${ci.upper} sessions (most likely: ${ci.median})`;
}

/**
 * Get user-friendly explanation of confidence level
 */
export function explainConfidence(confidenceLevel: number): string {
    const percentage = Math.round(confidenceLevel * 100);
    
    if (confidenceLevel >= 0.95) {
        return `Very high confidence (${percentage}%) - prediction is highly reliable`;
    } else if (confidenceLevel >= 0.80) {
        return `Good confidence (${percentage}%) - prediction is reasonably reliable`;
    } else if (confidenceLevel >= 0.60) {
        return `Moderate confidence (${percentage}%) - significant variability expected`;
    } else {
        return `Low confidence (${percentage}%) - high uncertainty, more data needed`;
    }
}

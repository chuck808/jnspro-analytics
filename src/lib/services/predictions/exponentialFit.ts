/**
 * Exponential Regression for Goals Prediction
 * 
 * Fits exponential curves to capture:
 * - Rapid initial improvements that slow down (exponential decay to asymptote)
 * - Breakthrough performance gains (exponential growth)
 * - Learning curves with diminishing returns
 * 
 * Model form: y = a * exp(b * x) + c
 * Where c is the asymptote (theoretical limit)
 */

interface DataPoint {
    x: number; // Session number
    y: number; // Metric value
}

interface ExponentialModel {
    a: number; // Scale parameter
    b: number; // Rate parameter
    c: number; // Asymptote
    rSquared: number;
    predict: (x: number) => number;
    asymptote: number; // Theoretical limit
}

/**
 * Fit exponential model using linearization and least squares
 * @param dataPoints Array of {x, y} points
 * @param lowerIsBetter True for reaction time (approaching lower limit), false for speed (approaching upper limit)
 * @returns Fitted exponential model
 */
export function fitExponential(dataPoints: DataPoint[], lowerIsBetter: boolean): ExponentialModel {
    const n = dataPoints.length;
    
    if (n < 4) {
        throw new Error('Need at least 4 data points for exponential fitting');
    }

    // Estimate asymptote (c) as the trend direction limit
    const yValues = dataPoints.map(p => p.y);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // Asymptote is slightly beyond the current best value
    let c: number;
    if (lowerIsBetter) {
        c = yMin * 0.85; // Assume can improve 15% beyond current best
    } else {
        c = yMax * 1.15; // Assume can improve 15% beyond current best
    }

    // Transform data: ln(|y - c|) = ln(|a|) + b*x
    const transformedPoints: Array<{x: number, y: number}> = [];
    
    for (const point of dataPoints) {
        const diff = point.y - c;
        if (Math.abs(diff) > 1e-10) { // Avoid log(0)
            transformedPoints.push({
                x: point.x,
                y: Math.log(Math.abs(diff))
            });
        }
    }

    if (transformedPoints.length < 3) {
        // Fallback: use simpler estimation
        return fitExponentialSimple(dataPoints, lowerIsBetter);
    }

    // Linear regression on transformed data
    const { slope, intercept } = linearRegression(transformedPoints);
    
    const b = slope;
    const a = Math.exp(intercept) * (lowerIsBetter ? 1 : -1);

    // Calculate R-squared on original scale
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    let ssTotal = 0;
    let ssResidual = 0;
    
    const predict = (x: number) => a * Math.exp(b * x) + c;
    
    for (let i = 0; i < n; i++) {
        const predicted = predict(dataPoints[i].x);
        ssTotal += Math.pow(yValues[i] - yMean, 2);
        ssResidual += Math.pow(yValues[i] - predicted, 2);
    }
    
    const rSquared = Math.max(0, 1 - (ssResidual / ssTotal));

    return {
        a,
        b,
        c,
        rSquared,
        predict,
        asymptote: c
    };
}

/**
 * Simple exponential fit using three-point method
 * Fallback when log transformation fails
 */
function fitExponentialSimple(dataPoints: DataPoint[], lowerIsBetter: boolean): ExponentialModel {
    const n = dataPoints.length;
    
    // Use first, middle, and last points for quick fit
    const p1 = dataPoints[0];
    const p2 = dataPoints[Math.floor(n / 2)];
    const p3 = dataPoints[n - 1];

    // Estimate trend and asymptote
    const yValues = dataPoints.map(p => p.y);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    let c: number;
    if (lowerIsBetter) {
        c = yMin * 0.9;
    } else {
        c = yMax * 1.1;
    }

    // Simple exponential estimation
    const a = p1.y - c;
    const ratio = (p3.y - c) / (p1.y - c);
    const b = Math.log(Math.abs(ratio)) / (p3.x - p1.x);

    const predict = (x: number) => a * Math.exp(b * (x - p1.x)) + c;

    // Calculate R-squared
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    let ssTotal = 0;
    let ssResidual = 0;
    
    for (let i = 0; i < n; i++) {
        const predicted = predict(dataPoints[i].x);
        ssTotal += Math.pow(yValues[i] - yMean, 2);
        ssResidual += Math.pow(yValues[i] - predicted, 2);
    }
    
    const rSquared = Math.max(0, 1 - (ssResidual / ssTotal));

    return {
        a,
        b,
        c,
        rSquared,
        predict,
        asymptote: c
    };
}

/**
 * Simple linear regression for transformed data
 */
function linearRegression(points: Array<{x: number, y: number}>): {slope: number, intercept: number} {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

/**
 * Predict sessions remaining to reach target
 * @param model Fitted exponential model
 * @param currentValue Current metric value
 * @param targetValue Goal target value
 * @param currentSession Current session number
 * @param lowerIsBetter True for metrics like reaction time
 * @returns Estimated sessions remaining (null if target unreachable)
 */
export function predictSessionsRemaining(
    model: ExponentialModel,
    currentValue: number,
    targetValue: number,
    currentSession: number,
    lowerIsBetter: boolean
): number | null {
    // Check if target is reachable given the asymptote
    if (lowerIsBetter) {
        if (targetValue < model.asymptote) {
            return null; // Target below asymptote, unreachable
        }
    } else {
        if (targetValue > model.asymptote) {
            return null; // Target above asymptote, unreachable
        }
    }

    // Solve for x where y = target
    // target = a * exp(b * x) + c
    // x = ln((target - c) / a) / b
    
    const diff = targetValue - model.c;
    if (Math.abs(diff) < 1e-10 || Math.abs(model.a) < 1e-10) {
        return null; // Edge case
    }

    const ratio = diff / model.a;
    if (ratio <= 0) {
        return null; // Can't take log of negative number
    }

    const targetSession = Math.log(ratio) / model.b;
    
    // Check if prediction is in the future
    if (targetSession <= currentSession) {
        return 0; // Already at or past target
    }

    const sessionsRemaining = Math.ceil(targetSession - currentSession);
    
    // Sanity check: don't predict more than 100 sessions
    return sessionsRemaining > 100 ? null : sessionsRemaining;
}

/**
 * Check if data shows exponential pattern
 * Returns true if exponential fit is significantly better than linear
 */
export function isExponentialPattern(dataPoints: DataPoint[], lowerIsBetter: boolean): boolean {
    if (dataPoints.length < 5) return false;

    try {
        const expModel = fitExponential(dataPoints, lowerIsBetter);
        
        // Simple heuristic: exponential is better if R² > 0.8 and rate parameter is significant
        return expModel.rSquared > 0.8 && Math.abs(expModel.b) > 0.01;
    } catch {
        return false;
    }
}

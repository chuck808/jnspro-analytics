/**
 * Polynomial Regression for Goals Prediction
 * 
 * Fits polynomial curves (degree 2 or 3) to capture non-linear improvement patterns.
 * Useful for modeling:
 * - Initial rapid improvement followed by plateaus
 * - Diminishing returns as skill level increases
 * - S-curves in learning progression
 */

interface DataPoint {
    x: number; // Session number (independent variable)
    y: number; // Metric value (dependent variable)
}

interface PolynomialModel {
    coefficients: number[]; // [a0, a1, a2, ...] for a0 + a1*x + a2*x^2 + ...
    degree: number;
    rSquared: number; // Goodness of fit (0-1, higher is better)
    predict: (x: number) => number;
}

/**
 * Fit a polynomial regression model
 * @param dataPoints Array of {x, y} points
 * @param degree Polynomial degree (2 for quadratic, 3 for cubic)
 * @returns Fitted model with prediction function
 */
export function fitPolynomial(dataPoints: DataPoint[], degree: number = 2): PolynomialModel {
    const n = dataPoints.length;
    
    if (n < degree + 1) {
        throw new Error(`Need at least ${degree + 1} data points for degree ${degree} polynomial`);
    }

    // Build design matrix X and response vector Y
    const X: number[][] = [];
    const Y: number[] = [];
    
    for (const point of dataPoints) {
        const row: number[] = [];
        for (let d = 0; d <= degree; d++) {
            row.push(Math.pow(point.x, d));
        }
        X.push(row);
        Y.push(point.y);
    }

    // Solve normal equations: (X^T * X) * beta = X^T * Y
    const coefficients = solveNormalEquations(X, Y);

    // Calculate R-squared
    const yMean = Y.reduce((sum, y) => sum + y, 0) / n;
    let ssTotal = 0;
    let ssResidual = 0;
    
    for (let i = 0; i < n; i++) {
        const predicted = polynomialValue(coefficients, dataPoints[i].x);
        ssTotal += Math.pow(Y[i] - yMean, 2);
        ssResidual += Math.pow(Y[i] - predicted, 2);
    }
    
    const rSquared = 1 - (ssResidual / ssTotal);

    return {
        coefficients,
        degree,
        rSquared,
        predict: (x: number) => polynomialValue(coefficients, x)
    };
}

/**
 * Evaluate polynomial at point x
 */
function polynomialValue(coefficients: number[], x: number): number {
    let result = 0;
    for (let i = 0; i < coefficients.length; i++) {
        result += coefficients[i] * Math.pow(x, i);
    }
    return result;
}

/**
 * Solve normal equations using matrix algebra
 * This is a simplified solver using Gaussian elimination
 */
function solveNormalEquations(X: number[][], Y: number[]): number[] {
    const n = X.length;
    const m = X[0].length;

    // Compute X^T * X
    const XTX: number[][] = Array(m).fill(0).map(() => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += X[k][i] * X[k][j];
            }
            XTX[i][j] = sum;
        }
    }

    // Compute X^T * Y
    const XTY: number[] = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
            sum += X[k][i] * Y[k];
        }
        XTY[i] = sum;
    }

    // Solve using Gaussian elimination with partial pivoting
    return gaussianElimination(XTX, XTY);
}

/**
 * Gaussian elimination solver
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented: number[][] = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }

        // Swap rows
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

        // Eliminate column
        for (let k = i + 1; k < n; k++) {
            const factor = augmented[k][i] / augmented[i][i];
            for (let j = i; j <= n; j++) {
                augmented[k][j] -= factor * augmented[i][j];
            }
        }
    }

    // Back substitution
    const x: number[] = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = augmented[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= augmented[i][j] * x[j];
        }
        x[i] /= augmented[i][i];
    }

    return x;
}

/**
 * Predict sessions remaining to reach target
 * @param model Fitted polynomial model
 * @param currentValue Current metric value
 * @param targetValue Goal target value
 * @param currentSession Current session number
 * @param lowerIsBetter True for metrics like reaction time, false for speed/power
 * @returns Estimated sessions remaining (null if target unreachable)
 */
export function predictSessionsRemaining(
    model: PolynomialModel,
    currentValue: number,
    targetValue: number,
    currentSession: number,
    lowerIsBetter: boolean
): number | null {
    // Search for session where prediction crosses target
    // Use binary search for efficiency
    
    const isMovingTowardsTarget = (prediction: number) => {
        if (lowerIsBetter) {
            return prediction <= targetValue;
        } else {
            return prediction >= targetValue;
        }
    };

    // Check if we can even reach the target (extrapolate up to 100 sessions)
    const maxFuture = currentSession + 100;
    const futureValue = model.predict(maxFuture);
    
    if (!isMovingTowardsTarget(futureValue)) {
        return null; // Target not reachable with current trend
    }

    // Binary search for crossing point
    let low = currentSession;
    let high = maxFuture;
    
    while (high - low > 0.1) {
        const mid = (low + high) / 2;
        const prediction = model.predict(mid);
        
        if (isMovingTowardsTarget(prediction)) {
            high = mid;
        } else {
            low = mid;
        }
    }

    const targetSession = Math.ceil(high);
    return Math.max(0, targetSession - currentSession);
}

/**
 * Determine best polynomial degree based on data
 * Tests degrees 1, 2, and 3, returns best based on adjusted R-squared
 */
export function selectBestDegree(dataPoints: DataPoint[]): number {
    const n = dataPoints.length;
    
    if (n < 4) return 1; // Not enough data for polynomial
    if (n < 6) return 2; // Limited data, use quadratic
    
    const degrees = [1, 2, 3];
    let bestDegree = 1;
    let bestAdjustedR2 = -Infinity;

    for (const degree of degrees) {
        if (n < degree + 2) continue; // Need more data than parameters
        
        try {
            const model = fitPolynomial(dataPoints, degree);
            
            // Adjusted R-squared penalizes model complexity
            const adjustedR2 = 1 - ((1 - model.rSquared) * (n - 1) / (n - degree - 1));
            
            if (adjustedR2 > bestAdjustedR2) {
                bestAdjustedR2 = adjustedR2;
                bestDegree = degree;
            }
        } catch {
            // Skip if fitting fails
            continue;
        }
    }

    return bestDegree;
}

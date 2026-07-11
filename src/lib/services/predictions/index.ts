/**
 * Predictions Service - Advanced Forecasting for Training Goals
 *
 * Provides intelligent prediction models with confidence intervals
 * for goal achievement estimates.
 */

// Re-export prediction models (with explicit naming to avoid conflicts)
export {
	fitPolynomial,
	selectBestDegree,
	predictSessionsRemaining as predictSessionsRemainingPolynomial
} from './polynomialRegression';

export {
	fitExponential,
	isExponentialPattern,
	predictSessionsRemaining as predictSessionsRemainingExponential
} from './exponentialFit';

export * from './confidenceIntervals';
export * from './modelSelector';

// Main prediction interface
import {
	selectBestModel,
	explainModel,
	isModelReliable,
	type SelectedModel
} from './modelSelector';
import type { ConfidenceInterval } from './confidenceIntervals';

/**
 * Generate comprehensive prediction for a training goal
 *
 * This is the main entry point for predictions - automatically selects
 * the best model and provides confidence intervals.
 *
 * @param sessionValues Historical performance values with session numbers
 * @param targetValue Goal target value
 * @param currentValue Current metric value
 * @param lowerIsBetter True for metrics like reaction time (lower is better)
 * @returns Complete prediction with model type, sessions remaining, and confidence interval
 */
export function predictGoalProgress(
	sessionValues: Array<{ sessionNumber: number; value: number }>,
	targetValue: number,
	currentValue: number,
	lowerIsBetter: boolean
): SelectedModel {
	// Transform to data points
	const dataPoints = sessionValues.map((sv) => ({
		x: sv.sessionNumber,
		y: sv.value
	}));

	// Select and fit best model
	return selectBestModel(dataPoints, targetValue, currentValue, lowerIsBetter);
}

/**
 * Quick prediction using simple linear regression
 * Useful when you need fast predictions without model comparison
 */
export function quickLinearPrediction(
	sessionValues: Array<{ sessionNumber: number; value: number }>,
	targetValue: number
): number | null {
	if (sessionValues.length < 2) return null;

	const n = sessionValues.length;
	let sumX = 0,
		sumY = 0,
		sumXY = 0,
		sumX2 = 0;

	for (const sv of sessionValues) {
		sumX += sv.sessionNumber;
		sumY += sv.value;
		sumXY += sv.sessionNumber * sv.value;
		sumX2 += sv.sessionNumber * sv.sessionNumber;
	}

	const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
	const intercept = (sumY - slope * sumX) / n;

	if (Math.abs(slope) < 1e-6) return null; // No trend

	const targetSession = (targetValue - intercept) / slope;
	const currentSession = sessionValues[n - 1].sessionNumber;

	if (targetSession <= currentSession) return 0; // Already achieved

	const sessionsRemaining = Math.ceil(targetSession - currentSession);
	return sessionsRemaining > 100 ? null : sessionsRemaining;
}

// Re-export key types
export type { SelectedModel, ConfidenceInterval };
export { explainModel, isModelReliable };

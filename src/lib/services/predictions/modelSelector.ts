/**
 * Model Selector - Intelligently chooses the best prediction model
 *
 * Compares linear, polynomial, and exponential models to find the best fit
 * for the user's performance data.
 */

import {
	fitPolynomial,
	selectBestDegree,
	predictSessionsRemaining as polyPredict
} from './polynomialRegression';
import {
	fitExponential,
	isExponentialPattern,
	predictSessionsRemaining as expPredict
} from './exponentialFit';
import { calculateConfidenceInterval, type ConfidenceInterval } from './confidenceIntervals';

interface DataPoint {
	x: number; // Session number
	y: number; // Metric value
}

export type ModelType = 'linear' | 'polynomial' | 'exponential';

export interface SelectedModel {
	type: ModelType;
	predict: (x: number) => number;
	rSquared: number;
	sessionsRemaining: number | null;
	confidenceInterval: ConfidenceInterval | null;
	metadata: {
		degree?: number; // For polynomial
		asymptote?: number; // For exponential
		reason: string; // Why this model was chosen
	};
}

/**
 * Automatically select and fit the best prediction model
 * @param dataPoints Historical performance data
 * @param targetValue Goal target value
 * @param currentValue Current metric value
 * @param lowerIsBetter True for metrics like reaction time
 * @returns Best-fit model with predictions
 */
export function selectBestModel(
	dataPoints: DataPoint[],
	targetValue: number,
	currentValue: number,
	lowerIsBetter: boolean
): SelectedModel {
	const n = dataPoints.length;
	const currentSession = dataPoints[dataPoints.length - 1].x;

	// Not enough data - use simple linear model
	if (n < 3) {
		return fitLinearModel(dataPoints, targetValue, currentSession, lowerIsBetter);
	}

	// Try all models and compare
	const candidates: SelectedModel[] = [];

	// 1. Linear Model (always try as baseline)
	try {
		const linear = fitLinearModel(dataPoints, targetValue, currentSession, lowerIsBetter);
		candidates.push(linear);
	} catch {
		// Linear fit failed
	}

	// 2. Polynomial Model (if enough data)
	if (n >= 4) {
		try {
			const poly = fitPolynomialModel(dataPoints, targetValue, currentSession, lowerIsBetter);
			candidates.push(poly);
		} catch {
			// Polynomial fit failed
		}
	}

	// 3. Exponential Model (if pattern detected)
	if (n >= 5 && isExponentialPattern(dataPoints, lowerIsBetter)) {
		try {
			const exp = fitExponentialModel(dataPoints, targetValue, currentSession, lowerIsBetter);
			candidates.push(exp);
		} catch {
			// Exponential fit failed
		}
	}

	// Select best model based on R² and prediction validity
	return selectBestCandidate(candidates, n);
}

/**
 * Fit simple linear regression model
 */
function fitLinearModel(
	dataPoints: DataPoint[],
	targetValue: number,
	currentSession: number,
	lowerIsBetter: boolean
): SelectedModel {
	const n = dataPoints.length;

	// Calculate linear regression
	let sumX = 0,
		sumY = 0,
		sumXY = 0,
		sumX2 = 0;
	for (const p of dataPoints) {
		sumX += p.x;
		sumY += p.y;
		sumXY += p.x * p.y;
		sumX2 += p.x * p.x;
	}

	const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
	const intercept = (sumY - slope * sumX) / n;

	const predict = (x: number) => slope * x + intercept;

	// Calculate R²
	const yMean = sumY / n;
	let ssTotal = 0,
		ssResidual = 0;
	for (const p of dataPoints) {
		const pred = predict(p.x);
		ssTotal += Math.pow(p.y - yMean, 2);
		ssResidual += Math.pow(p.y - pred, 2);
	}
	const rSquared = 1 - ssResidual / ssTotal;

	// Predict sessions remaining
	let sessionsRemaining: number | null = null;
	if (Math.abs(slope) > 1e-6) {
		const targetSession = (targetValue - intercept) / slope;
		if (targetSession > currentSession) {
			sessionsRemaining = Math.ceil(targetSession - currentSession);
			if (sessionsRemaining > 100) sessionsRemaining = null;
		} else {
			sessionsRemaining = 0;
		}
	}

	// Calculate confidence interval
	const confidenceInterval = calculateConfidenceInterval(
		dataPoints,
		{ predict, rSquared },
		targetValue,
		currentSession,
		lowerIsBetter,
		0.8
	);

	return {
		type: 'linear',
		predict,
		rSquared: Math.max(0, rSquared),
		sessionsRemaining,
		confidenceInterval,
		metadata: {
			reason: n < 5 ? 'Insufficient data for complex models' : 'Best fit is linear trend'
		}
	};
}

/**
 * Fit polynomial regression model
 */
function fitPolynomialModel(
	dataPoints: DataPoint[],
	targetValue: number,
	currentSession: number,
	lowerIsBetter: boolean
): SelectedModel {
	const degree = selectBestDegree(dataPoints);
	const model = fitPolynomial(dataPoints, degree);

	const sessionsRemaining = polyPredict(
		model,
		dataPoints[dataPoints.length - 1].y,
		targetValue,
		currentSession,
		lowerIsBetter
	);

	const confidenceInterval = calculateConfidenceInterval(
		dataPoints,
		model,
		targetValue,
		currentSession,
		lowerIsBetter,
		0.8
	);

	return {
		type: 'polynomial',
		predict: model.predict,
		rSquared: model.rSquared,
		sessionsRemaining,
		confidenceInterval,
		metadata: {
			degree,
			reason: `Non-linear ${degree === 2 ? 'quadratic' : 'cubic'} pattern detected`
		}
	};
}

/**
 * Fit exponential regression model
 */
function fitExponentialModel(
	dataPoints: DataPoint[],
	targetValue: number,
	currentSession: number,
	lowerIsBetter: boolean
): SelectedModel {
	const model = fitExponential(dataPoints, lowerIsBetter);

	const sessionsRemaining = expPredict(
		model,
		dataPoints[dataPoints.length - 1].y,
		targetValue,
		currentSession,
		lowerIsBetter
	);

	const confidenceInterval = calculateConfidenceInterval(
		dataPoints,
		model,
		targetValue,
		currentSession,
		lowerIsBetter,
		0.8
	);

	return {
		type: 'exponential',
		predict: model.predict,
		rSquared: model.rSquared,
		sessionsRemaining,
		confidenceInterval,
		metadata: {
			asymptote: model.asymptote,
			reason: `Approaching theoretical limit of ${model.asymptote.toFixed(2)}`
		}
	};
}

/**
 * Select best model from candidates
 */
function selectBestCandidate(candidates: SelectedModel[], dataCount: number): SelectedModel {
	if (candidates.length === 0) {
		throw new Error('No valid models could be fitted');
	}

	if (candidates.length === 1) {
		return candidates[0];
	}

	// Scoring function: prefer models with valid predictions and high R²
	const score = (model: SelectedModel): number => {
		let points = 0;

		// R² contribution (0-50 points)
		points += model.rSquared * 50;

		// Valid prediction bonus (30 points)
		if (
			model.sessionsRemaining !== null &&
			model.sessionsRemaining > 0 &&
			model.sessionsRemaining < 50
		) {
			points += 30;
		}

		// Confidence interval bonus (10 points)
		if (model.confidenceInterval !== null) {
			points += 10;
		}

		// Penalize overly complex models on small datasets
		if (dataCount < 8 && model.type === 'polynomial' && model.metadata.degree === 3) {
			points -= 15;
		}
		if (dataCount < 6 && model.type === 'exponential') {
			points -= 10;
		}

		// Bonus for exponential if asymptote is reasonable
		if (model.type === 'exponential' && model.metadata.asymptote) {
			const currentValue = model.predict(dataCount);
			const asymptote = model.metadata.asymptote;
			const distanceToAsymptote = Math.abs((currentValue - asymptote) / asymptote);

			// Bonus if we're reasonably far from asymptote (still room to improve)
			if (distanceToAsymptote > 0.1 && distanceToAsymptote < 0.5) {
				points += 15;
			}
		}

		return points;
	};

	// Find highest scoring model
	let best = candidates[0];
	let bestScore = score(best);

	for (let i = 1; i < candidates.length; i++) {
		const candidate = candidates[i];
		const candidateScore = score(candidate);

		if (candidateScore > bestScore) {
			best = candidate;
			bestScore = candidateScore;
		}
	}

	return best;
}

/**
 * Get user-friendly explanation of the selected model
 */
export function explainModel(model: SelectedModel): string {
	switch (model.type) {
		case 'linear':
			return 'Your performance shows a steady, consistent improvement trend.';

		case 'polynomial':
			if (model.metadata.degree === 2) {
				return 'Your improvement rate is changing over time (accelerating or slowing).';
			} else {
				return 'Your performance shows a complex, non-linear progression pattern.';
			}

		case 'exponential':
			return `Your progress is approaching a performance limit around ${model.metadata.asymptote?.toFixed(2)}.`;

		default:
			return 'Using standard prediction model.';
	}
}

/**
 * Validate that model is suitable for prediction
 */
export function isModelReliable(model: SelectedModel): boolean {
	// Need reasonable R² for reliability
	if (model.rSquared < 0.3) return false;

	// Need valid prediction
	if (model.sessionsRemaining === null) return false;

	// Prediction should be reasonable (not too far in future)
	if (model.sessionsRemaining > 50) return false;

	return true;
}

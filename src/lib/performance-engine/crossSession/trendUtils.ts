/**
 * Performance Engine v8.0 — Trend Analysis Utilities
 *
 * Handles direction detection with proper higher-is-better / lower-is-better logic
 */

import type { TrendResult, TrendDirection } from './types';

interface TrendOptions {
	higherIsBetter?: boolean;
	stabilityThreshold?: number; // percent change to consider "stable"
}

/**
 * Calculate trend from a series of values
 *
 * @param values - Array of numeric values (oldest first)
 * @param options - Trend calculation options
 * @returns TrendResult with direction, change, and improvement status
 */
export function calculateTrend(values: (number | null)[], options: TrendOptions = {}): TrendResult {
	const { higherIsBetter = true, stabilityThreshold = 3 } = options;

	// Filter out null values
	const validValues = values.filter((v): v is number => v !== null && !isNaN(v));

	if (validValues.length < 2) {
		return {
			direction: 'unknown',
			change: null,
			changePercent: null,
			recent: null,
			historical: null,
			improving: false
		};
	}

	// Calculate recent (last 3 or available) and historical (all others) averages
	const recentCount = Math.min(3, Math.floor(validValues.length / 2));
	const recent = validValues.slice(-recentCount);
	const historical = validValues.slice(0, -recentCount);

	const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
	const historicalAvg =
		historical.length > 0
			? historical.reduce((a, b) => a + b, 0) / historical.length
			: validValues[0];

	const change = recentAvg - historicalAvg;
	const changePercent = historicalAvg !== 0 ? (change / Math.abs(historicalAvg)) * 100 : 0;

	// Determine direction
	let direction: TrendDirection = 'stable';
	if (Math.abs(changePercent) > stabilityThreshold) {
		direction = change > 0 ? 'up' : 'down';
	}

	// Determine if improving (depends on higher-is-better logic)
	const improving = higherIsBetter ? direction === 'up' : direction === 'down';

	return {
		direction,
		change,
		changePercent,
		recent: recentAvg,
		historical: historicalAvg,
		improving
	};
}

/**
 * Extract values from session summaries for a specific metric
 */
export function extractMetric(
	sessions: Array<{ [key: string]: any }>,
	metricKey: string
): (number | null)[] {
	return sessions.map((s) => {
		const value = s[metricKey];
		return typeof value === 'number' && !isNaN(value) ? value : null;
	});
}

/**
 * Sort sessions by date (oldest first)
 */
export function sortByDate<T extends { date: string | Date }>(sessions: T[]): T[] {
	return [...sessions].sort((a, b) => {
		const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
		const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
		return dateA.getTime() - dateB.getTime();
	});
}

/**
 * Get confidence level based on session count
 */
export function getConfidence(sessionCount: number): 'low' | 'moderate' | 'high' {
	if (sessionCount < 5) return 'low';
	if (sessionCount < 10) return 'moderate';
	return 'high';
}

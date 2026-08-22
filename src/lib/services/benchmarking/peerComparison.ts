/**
 * Peer Comparison for Performance Benchmarking
 *
 * Compares user performance against anonymized peer groups
 * while maintaining privacy and providing meaningful insights.
 */

export type AgeGroup = 'under-13' | '13-17' | '18-25' | '26-35' | '36-45' | '46+';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export interface PerformanceBenchmark {
	metric: string;
	percentile_10: number; // Bottom 10%
	percentile_25: number; // Lower quartile
	percentile_50: number; // Median
	percentile_75: number; // Upper quartile
	percentile_90: number; // Top 10%
	sampleSize: number;
	lastUpdated: Date;
}

export interface PeerComparisonResult {
	userValue: number;
	userPercentile: number; // 0-100 (higher is better for most metrics)
	ranking:
		| 'top_10'
		| 'top_25'
		| 'above_average'
		| 'average'
		| 'below_average'
		| 'needs_improvement';
	comparisonText: string;
	suggestedGoal: number | null;
	ageGroup: AgeGroup;
	experienceLevel: ExperienceLevel;
	sampleSize: number;
}

/**
 * Compare user's performance against peer group
 */
export function compareToPeers(
	userValue: number,
	metric: string,
	ageGroup: AgeGroup,
	experienceLevel: ExperienceLevel,
	benchmark: PerformanceBenchmark,
	lowerIsBetter: boolean
): PeerComparisonResult {
	const percentile = calculatePercentile(userValue, benchmark, lowerIsBetter);
	const ranking = determineRanking(percentile);
	const comparisonText = generateComparisonText(percentile, ranking, metric, experienceLevel);
	const suggestedGoal = suggestNextGoal(userValue, percentile, benchmark, lowerIsBetter);

	return {
		userValue,
		userPercentile: percentile,
		ranking,
		comparisonText,
		suggestedGoal,
		ageGroup,
		experienceLevel,
		sampleSize: benchmark.sampleSize
	};
}

function calculatePercentile(
	value: number,
	benchmark: PerformanceBenchmark,
	lowerIsBetter: boolean
): number {
	const { percentile_10, percentile_25, percentile_50, percentile_75, percentile_90 } = benchmark;

	if (lowerIsBetter) {
		if (value <= percentile_10) return 90;
		if (value <= percentile_25) return interpolate(value, percentile_10, percentile_25, 90, 75);
		if (value <= percentile_50) return interpolate(value, percentile_25, percentile_50, 75, 50);
		if (value <= percentile_75) return interpolate(value, percentile_50, percentile_75, 50, 25);
		if (value <= percentile_90) return interpolate(value, percentile_75, percentile_90, 25, 10);
		return Math.max(0, 10 - ((value - percentile_90) / percentile_90) * 10);
	}

	if (value >= percentile_90) return 90;
	if (value >= percentile_75) return interpolate(value, percentile_75, percentile_90, 75, 90);
	if (value >= percentile_50) return interpolate(value, percentile_50, percentile_75, 50, 75);
	if (value >= percentile_25) return interpolate(value, percentile_25, percentile_50, 25, 50);
	if (value >= percentile_10) return interpolate(value, percentile_10, percentile_25, 10, 25);
	return Math.max(0, 10 - ((percentile_10 - value) / percentile_10) * 10);
}

function interpolate(value: number, x1: number, x2: number, y1: number, y2: number): number {
	if (x2 === x1) return y1;
	return y1 + ((value - x1) / (x2 - x1)) * (y2 - y1);
}

function determineRanking(percentile: number): PeerComparisonResult['ranking'] {
	if (percentile >= 90) return 'top_10';
	if (percentile >= 75) return 'top_25';
	if (percentile >= 60) return 'above_average';
	if (percentile >= 40) return 'average';
	if (percentile >= 25) return 'below_average';
	return 'needs_improvement';
}

function generateComparisonText(
	percentile: number,
	ranking: PeerComparisonResult['ranking'],
	metric: string,
	experienceLevel: ExperienceLevel
): string {
	const percentileText = `${Math.round(percentile)}th percentile`;
	const levelText =
		experienceLevel === 'beginner'
			? 'beginners'
			: experienceLevel === 'intermediate'
				? 'intermediate riders'
				: experienceLevel === 'advanced'
					? 'advanced riders'
					: 'elite riders';

	switch (ranking) {
		case 'top_10':
			return `Outstanding! You're in the top 10% of ${levelText} for ${metric}. (${percentileText})`;
		case 'top_25':
			return `Excellent! You're in the top 25% of ${levelText} for ${metric}. (${percentileText})`;
		case 'above_average':
			return `Good! You're above average among ${levelText} for ${metric}. (${percentileText})`;
		case 'average':
			return `You're performing at an average level among ${levelText} for ${metric}. (${percentileText})`;
		case 'below_average':
			return `You're below average among ${levelText} for ${metric}. Room for improvement! (${percentileText})`;
		case 'needs_improvement':
			return `Focus on improving ${metric}. You have significant room to grow among ${levelText}. (${percentileText})`;
	}
}

function suggestNextGoal(
	currentValue: number,
	percentile: number,
	benchmark: PerformanceBenchmark,
	lowerIsBetter: boolean
): number | null {
	if (percentile < 25) return benchmark.percentile_25;
	if (percentile < 50) return benchmark.percentile_50;
	if (percentile < 75) return benchmark.percentile_75;
	if (percentile < 90) return benchmark.percentile_90;

	const improvement = lowerIsBetter ? -0.05 : 0.05;
	return currentValue * (1 + improvement);
}

/**
 * Determine user's broad benchmark age group.
 *
 * Under-13 riders are explicit rather than being folded into 13-17. That keeps
 * youth evidence out of an older cohort and allows the aggregate service to fall
 * back honestly when the under-13 sample is still too small.
 */
export function determineAgeGroup(age: number): AgeGroup {
	if (age < 13) return 'under-13';
	if (age < 18) return '13-17';
	if (age < 26) return '18-25';
	if (age < 36) return '26-35';
	if (age < 46) return '36-45';
	return '46+';
}

export function estimateExperienceLevel(
	sessionCount: number,
	avgPerformancePercentile: number
): ExperienceLevel {
	if (sessionCount < 10) return 'beginner';

	if (sessionCount < 30) {
		return avgPerformancePercentile >= 70 ? 'intermediate' : 'beginner';
	}

	if (sessionCount < 100) {
		if (avgPerformancePercentile >= 85) return 'advanced';
		if (avgPerformancePercentile >= 60) return 'intermediate';
		return 'beginner';
	}

	if (avgPerformancePercentile >= 90) return 'elite';
	if (avgPerformancePercentile >= 75) return 'advanced';
	if (avgPerformancePercentile >= 50) return 'intermediate';
	return 'beginner';
}

export function getRankingColor(ranking: PeerComparisonResult['ranking']): string {
	switch (ranking) {
		case 'top_10':
		case 'top_25':
			return '#3de8c8';
		case 'above_average':
		case 'average':
			return '#f5a623';
		case 'below_average':
			return '#ff6b3d';
		case 'needs_improvement':
			return '#ff4444';
	}
}

export function getRankingEmoji(ranking: PeerComparisonResult['ranking']): string {
	switch (ranking) {
		case 'top_10':
			return '🏆';
		case 'top_25':
			return '🥇';
		case 'above_average':
			return '👍';
		case 'average':
			return '✅';
		case 'below_average':
			return '📈';
		case 'needs_improvement':
			return '💪';
	}
}

export function formatBenchmarkValue(value: number, metric: string): string {
	const lowerMetric = metric.toLowerCase();

	if (lowerMetric.includes('reaction') || lowerMetric.includes('time')) {
		return `${(value / 1000).toFixed(3)}s`;
	}
	if (lowerMetric.includes('speed')) {
		return `${(value * 3.6).toFixed(1)} km/h`;
	}
	if (lowerMetric.includes('power') || lowerMetric.includes('g')) {
		return `${value.toFixed(2)}g`;
	}
	return value.toFixed(2);
}

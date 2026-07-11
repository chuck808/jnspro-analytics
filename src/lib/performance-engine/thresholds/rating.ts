import type { BMXThresholdProfile, MetricThreshold, ThresholdRating } from './types';
import { getThresholdProfile } from './profiles';

export function rateMetric(
	metric: keyof BMXThresholdProfile['metrics'],
	value: number | null | undefined,
	profile: BMXThresholdProfile
): ThresholdRating {
	const threshold = profile.metrics[metric];

	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return {
			metric,
			value,
			rating: 'unknown',
			threshold,
			message: `${threshold.unit ? metric + ' ' : metric}not available.`
		};
	}

	const rating =
		threshold.direction === 'higher-is-better'
			? rateHigherIsBetter(value, threshold)
			: rateLowerIsBetter(value, threshold);

	return {
		metric,
		value,
		rating,
		threshold,
		message: buildRatingMessage(metric, value, rating, threshold)
	};
}

export function rateSessionMetrics(
	values: Partial<Record<keyof BMXThresholdProfile['metrics'], number | null | undefined>>,
	level: 'grom' | 'rider' | 'elite' | 'coach' = 'rider'
): ThresholdRating[] {
	const profile = getThresholdProfile(level);
	return (Object.keys(profile.metrics) as Array<keyof BMXThresholdProfile['metrics']>)
		.filter((metric) => metric in values)
		.map((metric) => rateMetric(metric, values[metric], profile));
}

function rateHigherIsBetter(value: number, threshold: MetricThreshold): ThresholdRating['rating'] {
	if (value >= threshold.excellent) return 'excellent';
	if (value >= threshold.good) return 'good';
	if (value >= threshold.caution) return 'caution';
	return 'poor';
}

function rateLowerIsBetter(value: number, threshold: MetricThreshold): ThresholdRating['rating'] {
	if (value <= threshold.excellent) return 'excellent';
	if (value <= threshold.good) return 'good';
	if (value <= threshold.caution) return 'caution';
	return 'poor';
}

function buildRatingMessage(
	metric: string,
	value: number,
	rating: ThresholdRating['rating'],
	threshold: MetricThreshold
): string {
	const formatted = `${value.toFixed(value < 1 ? 3 : 1)}${threshold.unit}`;
	const label = metric.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());

	if (rating === 'excellent') return `${label}: excellent (${formatted}).`;
	if (rating === 'good') return `${label}: good (${formatted}).`;
	if (rating === 'caution') return `${label}: caution (${formatted}); watch this metric.`;
	if (rating === 'poor') return `${label}: needs attention (${formatted}).`;
	return `${label}: unknown.`;
}

export type FatigueTrend = 'improving' | 'stable' | 'declining' | 'unknown';

export interface FatigueAnalysis {
	trend: FatigueTrend;
	diff?: number;
	firstHalfAvg?: number;
	secondHalfAvg?: number;
}

export function analyseFatigue(values: number[]): FatigueAnalysis {
	if (values.length < 4) return { trend: 'unknown' };

	const mid = Math.floor(values.length / 2);

	const first = values.slice(0, mid);
	const second = values.slice(mid);

	const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

	const firstHalfAvg = avg(first);
	const secondHalfAvg = avg(second);
	const diff = secondHalfAvg - firstHalfAvg;

	let trend: FatigueTrend = 'stable';

	// Speed values are passed in. Higher speed is better.
	// Second half faster than first = rider improved through session = improving.
	// Second half slower than first = rider fatigued through session = declining.
	if (diff > 0.05) trend = 'improving';
	if (diff < -0.05) trend = 'declining';

	return {
		trend,
		diff,
		firstHalfAvg,
		secondHalfAvg
	};
}

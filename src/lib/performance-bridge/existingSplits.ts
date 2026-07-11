import type { AppAccelerationSplit, AppSpeedCurveLike } from './types';

/**
 * This mirrors the new app's current acceleration split behaviour.
 * Prefer importing calculateSpeedSplits from $lib/utils/analytics in the app itself.
 * This copy exists only for tests, isolation, and future migration.
 */
export function calculateExistingAccelerationSplits(
	curve: AppSpeedCurveLike,
	peakSpeedKmh = curve.speeds.length ? Math.max(...curve.speeds) : 0
): AppAccelerationSplit[] {
	if (!curve.times.length || !curve.speeds.length) return [];

	const thresholds = [
		{ kmh: 10, label: '0 → 10 km/h', phase: 'Launch' },
		{ kmh: 20, label: '0 → 20 km/h', phase: 'Early acceleration' },
		{ kmh: 30, label: '0 → 30 km/h', phase: 'Mid acceleration' },
		{ kmh: 40, label: '0 → 40 km/h', phase: 'Peak power' },
		{ kmh: 50, label: '0 → 50 km/h', phase: 'Maximum power' },
		{ kmh: 60, label: '0 → 60 km/h', phase: 'Elite speed' }
	].filter((t) => t.kmh <= peakSpeedKmh * 0.95);

	return thresholds
		.map((t) => {
			const idx = curve.speeds.findIndex((speed) => speed >= t.kmh);
			if (idx === -1) return null;
			return {
				label: t.label,
				phase: t.phase,
				timeS: round(curve.times[idx], 3),
				distanceM: round(curve.distances[idx] ?? 0, 2)
			};
		})
		.filter((split): split is AppAccelerationSplit => split !== null);
}

function round(value: number, dp = 2): number {
	const factor = 10 ** dp;
	return Math.round(value * factor) / factor;
}

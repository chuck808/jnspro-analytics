import { describe, expect, it } from 'vitest';
import {
	GRAVITY_MS2,
	analyseImpulse,
	calculateSpeedSplits,
	classifySpeedProfile,
	computeJerk,
	computeSpeedCurve,
	type SpeedCurve
} from './physics';

describe('computeSpeedCurve', () => {
	it('returns empty series for missing/short/zero-duration input', () => {
		expect(computeSpeedCurve([], 1000)).toEqual({
			times: [],
			speeds: [],
			accels: [],
			distances: []
		});
		expect(computeSpeedCurve([0.1], 1000)).toEqual({
			times: [],
			speeds: [],
			accels: [],
			distances: []
		});
		expect(computeSpeedCurve([0.1, 0.1], 0)).toEqual({
			times: [],
			speeds: [],
			accels: [],
			distances: []
		});
	});

	it('double-integrates constant forward acceleration into a linear speed/distance ramp', () => {
		// dt = (elapsedMs/1000) / n = 2000/1000 / 2 = 1s per sample
		const curve = computeSpeedCurve([0.1, 0.1], 2000);
		const accelMs2 = 0.1 * GRAVITY_MS2;

		expect(curve.times).toEqual([0, 1]);
		expect(curve.accels).toEqual([0.1, 0.1]);
		expect(curve.speeds[0]).toBeCloseTo(accelMs2 * 3.6, 6);
		expect(curve.speeds[1]).toBeCloseTo(accelMs2 * 2 * 3.6, 6);
		expect(curve.distances[0]).toBeCloseTo(accelMs2, 6);
		expect(curve.distances[1]).toBeCloseTo(accelMs2 * 3, 6);
	});

	it('subtracts the bias correction before integrating', () => {
		// A bias equal to the acceleration itself should cancel motion entirely.
		const accelMs2 = 0.1 * GRAVITY_MS2;
		const curve = computeSpeedCurve([0.1, 0.1], 2000, accelMs2);
		expect(curve.speeds.every((s) => s === 0)).toBe(true);
		expect(curve.distances.every((d) => d === 0)).toBe(true);
	});

	it('rescales the whole curve so its peak matches firmware-measured peak speed, preserving shape', () => {
		const raw = computeSpeedCurve([0.05, 0.1, 0.2], 3000);
		const predictedPeak = Math.max(...raw.speeds);
		const measuredPeakKmh = predictedPeak * 3; // arbitrary firmware ground truth

		const scaled = computeSpeedCurve([0.05, 0.1, 0.2], 3000, 0, measuredPeakKmh);

		// Peak now matches the firmware value exactly.
		expect(Math.max(...scaled.speeds)).toBeCloseTo(measuredPeakKmh, 6);
		// Shape (ratio between samples) is unchanged — this is exactly what
		// CRITICAL_FINDING.md flagged as still-unreliable: only the magnitude
		// is corrected, not the underlying IMU-integration shape.
		expect(scaled.speeds[0] / scaled.speeds[2]).toBeCloseTo(raw.speeds[0] / raw.speeds[2], 6);
		expect(scaled.distances[0] / scaled.distances[2]).toBeCloseTo(
			raw.distances[0] / raw.distances[2],
			6
		);
	});

	it('does not rescale when no firmware peak speed is supplied', () => {
		const raw = computeSpeedCurve([0.05, 0.1, 0.2], 3000);
		expect(computeSpeedCurve([0.05, 0.1, 0.2], 3000, 0, null)).toEqual(raw);
		expect(computeSpeedCurve([0.05, 0.1, 0.2], 3000, 0, 0)).toEqual(raw);
		expect(computeSpeedCurve([0.05, 0.1, 0.2], 3000, 0, -5)).toEqual(raw);
	});

	it('skips rescaling when the predicted peak is non-positive (e.g. pure deceleration trace)', () => {
		const raw = computeSpeedCurve([-0.05, -0.1], 2000);
		expect(Math.max(...raw.speeds)).toBeLessThanOrEqual(0);
		expect(computeSpeedCurve([-0.05, -0.1], 2000, 0, 40)).toEqual(raw);
	});
});

describe('calculateSpeedSplits', () => {
	const curve: SpeedCurve = {
		times: [0, 1, 2, 3, 4, 5, 6],
		speeds: [0, 10, 20, 30, 40, 50, 60],
		accels: [0, 0, 0, 0, 0, 0, 0],
		distances: [0, 1, 2, 3, 4, 5, 6]
	};

	it('only includes thresholds reachable within 95% of peak speed', () => {
		const splits = calculateSpeedSplits(curve, 60);
		// 60 km/h threshold is excluded: 60 > 60 * 0.95
		expect(splits.map((s) => s.label)).toEqual([
			'0 → 10 km/h',
			'0 → 20 km/h',
			'0 → 30 km/h',
			'0 → 40 km/h',
			'0 → 50 km/h'
		]);
	});

	it('reports the time/distance at first sample reaching each threshold', () => {
		const splits = calculateSpeedSplits(curve, 60);
		const first = splits[0];
		expect(first.timeS).toBe(1);
		expect(first.distanceM).toBe(1);
	});

	it('returns an empty array for an empty curve', () => {
		expect(calculateSpeedSplits({ times: [], speeds: [], accels: [], distances: [] }, 40)).toEqual(
			[]
		);
	});
});

describe('classifySpeedProfile', () => {
	it('classifies by fraction of elapsed time to reach peak', () => {
		expect(classifySpeedProfile(400, 1000)).toBe('Explosive'); // 40%
		expect(classifySpeedProfile(600, 1000)).toBe('Balanced'); // 60%
		expect(classifySpeedProfile(800, 1000)).toBe('Late Peak'); // 80%
	});

	it('returns a placeholder for missing timing data', () => {
		expect(classifySpeedProfile(null, 1000)).toBe('—');
		expect(classifySpeedProfile(500, 0)).toBe('—');
	});
});

describe('analyseImpulse', () => {
	it('returns null without a rider mass or enough samples', () => {
		expect(analyseImpulse([0.1, 0.2], 1000, null)).toBeNull();
		expect(analyseImpulse([0.1], 1000, 80)).toBeNull();
	});

	it('accumulates a monotonically non-decreasing impulse series', () => {
		const result = analyseImpulse([0.1, 0.2, 0.15], 1000, 80)!;
		expect(result.totalImpulseNs).toBeGreaterThan(0);
		for (let i = 1; i < result.series.length; i++) {
			expect(result.series[i].value).toBeGreaterThanOrEqual(result.series[i - 1].value);
		}
	});
});

describe('computeJerk', () => {
	it('returns null for insufficient samples', () => {
		expect(computeJerk([0.1, 0.2], 1000)).toBeNull();
	});

	it('reports perfect smoothness for constant acceleration', () => {
		const result = computeJerk([0.1, 0.1, 0.1, 0.1, 0.1], 1000)!;
		expect(result.meanAbsolute).toBeCloseTo(0, 6);
		expect(result.smoothnessScore).toBe(100);
	});
});

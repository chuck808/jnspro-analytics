import { describe, expect, it } from 'vitest';
import { analyseRun, analyseSession } from './analyseSession';
import type { RunLike, SessionLike } from './types';

// Regression coverage for the fix to CRITICAL_FINDING.md: chart_data-integrated
// speed is shape-only and must never be trusted over firmware's measured
// peak/avg/end speed for single-number display values.

function makeRun(overrides: Partial<RunLike> = {}): RunLike {
	return {
		run_number: 1,
		elapsed_time_ms: 2000,
		chart_data: [0.05, 0.4, 0.9], // deliberately noisy/unrealistic IMU shape
		gate_runs: {
			reaction_time_ms: 150,
			max_g: 0.9,
			peak_speed_ms: 12.5, // firmware: 45 km/h
			avg_speed_ms_calc: 8.33, // firmware: ~30 km/h
			speed_ms: 11.1, // firmware: ~40 km/h end speed
			analytics_valid: true
		},
		...overrides
	};
}

describe('analyseRun — firmware speed anchoring', () => {
	it('exposes measured peak/avg/end speed straight from gate_runs, independent of curve shape', () => {
		const run = makeRun();
		const analysis = analyseRun(run, {});

		expect(analysis.physics!.measuredPeakSpeedKmh).toBeCloseTo(12.5 * 3.6, 1);
		expect(analysis.physics!.measuredAvgSpeedKmh).toBeCloseTo(8.33 * 3.6, 1);
		expect(analysis.physics!.measuredEndSpeedKmh).toBeCloseTo(11.1 * 3.6, 1);
		expect(analysis.physics!.speedCurveEstimated).toBe(true);
	});

	it('falls back to null (not a fabricated number) when firmware did not report a value', () => {
		const run = makeRun({
			gate_runs: { reaction_time_ms: 150, max_g: 0.9, analytics_valid: true }
		});
		const analysis = analyseRun(run, {});

		expect(analysis.physics!.measuredPeakSpeedKmh).toBeNull();
		expect(analysis.physics!.measuredAvgSpeedKmh).toBeNull();
		expect(analysis.physics!.measuredEndSpeedKmh).toBeNull();
	});

	it('still rescales the estimated curve to the firmware peak (for splits/distances, which have no firmware equivalent)', () => {
		const run = makeRun();
		const analysis = analyseRun(run, {});
		const peak = Math.max(...analysis.physics!.speedKmh);
		expect(peak).toBeCloseTo(12.5 * 3.6, 1);
	});
});

describe('analyseSession — summary peak speed prefers firmware truth', () => {
	it('uses measured peak speed even when the IMU-integrated curve would suggest a different peak', () => {
		const session: SessionLike = {
			runs: [
				makeRun({ run_number: 1 }),
				makeRun({ run_number: 2, gate_runs: { ...makeRun().gate_runs, peak_speed_ms: 15 } })
			]
		};
		const analysis = analyseSession(session, {});

		// Best run's firmware peak (15 m/s = 54 km/h) should win, not some
		// artifact of the noisy chart_data integration.
		expect(analysis.summary.peakSpeedKmh).toBeCloseTo(54, 0);
	});

	it('falls back to the estimated curve peak only when no run has a firmware value', () => {
		const run = makeRun({
			gate_runs: { reaction_time_ms: 150, max_g: 0.9, analytics_valid: true }
		});
		const session: SessionLike = { runs: [run] };
		const analysis = analyseSession(session, {});

		expect(analysis.summary.peakSpeedKmh).not.toBeNull();
	});
});

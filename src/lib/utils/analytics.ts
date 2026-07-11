/**
 * BMX Analytics Computation Library
 *
 * @deprecated LEGACY SYSTEM - Use Performance Engine instead
 *
 * This module has been superseded by the Performance Engine.
 * All functions have been migrated to:
 *   - performance-engine/physics.ts
 *   - performance-engine/technique.ts
 *   - performance-engine/dataQuality.ts
 *
 * Migration completed: May 1, 2026 (Phases 1-3)
 *
 * STATUS: Preserved for reference only - DO NOT USE in new code
 *
 * Migration guide:
 *   OLD: import { computeSpeedCurve } from '$lib/utils/analytics'
 *   NEW: import { analyseSession } from '$lib/performance-engine'
 *        const analysis = analyseSession(session, rider)
 *        // Speed curve in: analysis.selectedRun.physics.speedKmh
 *
 * See: PHASE_1_LEGACY_MIGRATION_COMPLETE.md for full migration details
 *
 * ---
 *
 * Original documentation:
 * Ported and corrected from:
 *   - firmware dashboard (normaliseRunData, calculateSpeedSplits, computeSpeedCurve)
 *   - old analytics-app (bmxAnalysis.ts, techniqueService.ts, statisticalAnalysis.ts)
 *
 * Key corrections vs old app:
 *   - Sample rate: 200Hz (was wrongly 9.3Hz in old app)
 *   - G_TO_MS2: 9.80665 (was 0.00981 in old app)
 *   - chartData arrives as float G-units (already divided by ingest layer)
 */

const GRAVITY = 9.80665; // m/s²
const RAD_TO_DEG = 180 / Math.PI;

// ─── Speed curve computation ──────────────────────────────────────────────────

export interface SpeedCurve {
	times: number[]; // seconds
	speeds: number[]; // km/h
	accels: number[]; // G-units (original)
	distances: number[]; // metres (cumulative)
}

export function computeSpeedCurve(
	chartData: number[], // float G-units
	elapsedMs: number,
	biasMs2: number = 0, // m/s² bias correction
	actualPeakSpeedKmh?: number | null // Firmware-measured peak speed for scaling
): SpeedCurve {
	if (!chartData || chartData.length < 2) {
		return { times: [], speeds: [], accels: [], distances: [] };
	}

	const dt = elapsedMs / 1000 / chartData.length; // seconds per sample
	let velocity = 0;
	let distance = 0;

	const times: number[] = [];
	const speeds: number[] = [];
	const accels: number[] = [];
	const distances: number[] = [];

	chartData.forEach((g, i) => {
		// chart_data contains linearAccelG (forward-only, gravity-removed)
		// This gives us the SHAPE of the speed curve, but wrong magnitude
		const accelMs2 = g * GRAVITY - biasMs2;
		velocity += accelMs2 * dt;
		distance += velocity * dt;

		times.push(i * dt);
		speeds.push(velocity * 3.6); // m/s → km/h
		accels.push(g);
		distances.push(distance);
	});

	// Scale the predicted curve to match firmware-measured reality
	if (actualPeakSpeedKmh && actualPeakSpeedKmh > 0 && speeds.length > 0) {
		const predictedPeak = Math.max(...speeds);
		if (predictedPeak > 0) {
			const scaleFactor = actualPeakSpeedKmh / predictedPeak;
			const scaledSpeeds = speeds.map((s) => s * scaleFactor);
			const scaledDistances = distances.map((d) => d * scaleFactor);
			return { times, speeds: scaledSpeeds, accels, distances: scaledDistances };
		}
	}

	return { times, speeds, accels, distances };
}

// ─── Speed splits ─────────────────────────────────────────────────────────────

export interface SpeedSplit {
	label: string;
	phase: string;
	timeS: number;
	distanceM: number;
}

export function calculateSpeedSplits(curve: SpeedCurve, peakSpeedKmh: number): SpeedSplit[] {
	if (!curve.times.length) return [];

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
			const idx = curve.speeds.findIndex((s) => s >= t.kmh);
			if (idx === -1) return null;
			return {
				label: t.label,
				phase: t.phase,
				timeS: parseFloat(curve.times[idx].toFixed(3)),
				distanceM: parseFloat(curve.distances[idx].toFixed(2))
			};
		})
		.filter(Boolean) as SpeedSplit[];
}

// ─── Data quality ─────────────────────────────────────────────────────────────

export interface DataQuality {
	label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
	color: string;
	badge: string;
	description: string;
}

export function assessDataQuality(biasMs2: number | null): DataQuality {
	if (biasMs2 === null) {
		return {
			label: 'Poor',
			color: '#ff4444',
			badge: '⚠ No data',
			description: 'Speed analytics unavailable'
		};
	}
	const abs = Math.abs(biasMs2);
	if (abs < 0.5)
		return {
			label: 'Excellent',
			color: '#3de8c8',
			badge: '✓ Excellent',
			description: 'Highly accurate speed tracking'
		};
	if (abs < 1.0)
		return {
			label: 'Good',
			color: '#f5a623',
			badge: '✓ Good',
			description: 'Reliable speed tracking'
		};
	if (abs < 2.0)
		return {
			label: 'Fair',
			color: '#ffcc44',
			badge: '⚠ Fair',
			description: 'Minor drift — check sensor placement'
		};
	return {
		label: 'Poor',
		color: '#ff4444',
		badge: '⚠ Poor',
		description: 'High drift — calibrate before next session'
	};
}

// ─── Speed profile classification ─────────────────────────────────────────────

export function classifySpeedProfile(timeToPeakMs: number | null, elapsedMs: number): string {
	if (!timeToPeakMs || !elapsedMs) return '—';
	const pct = (timeToPeakMs / elapsedMs) * 100;
	if (pct < 55) return 'Explosive';
	if (pct < 75) return 'Balanced';
	return 'Late Peak';
}

// ─── Technique scoring ────────────────────────────────────────────────────────

export interface TechniqueScores {
	overall: number; // 0–100
	reaction: number; // 0–100
	explosiveness: number; // 0–100
	smoothness: number; // 0–100
	efficiency: number; // 0–100
}

export function scoreTechnique(
	reactionMs: number,
	chartData: number[],
	curve: SpeedCurve,
	riderLevel: string | null
): TechniqueScores {
	// Reaction benchmark by level
	const benchmarks: Record<string, number> = {
		novice: 350,
		intermediate: 300,
		expert: 250,
		elite: 220
	};
	const benchmark = benchmarks[riderLevel ?? 'intermediate'] ?? 280;

	// Reaction score (100 = at benchmark, scales down above)
	const reactionScore = Math.min(100, (benchmark / reactionMs) * 100);

	// Explosiveness — how quickly peak G is reached (first 30% of run)
	const driveWindow = Math.floor(chartData.length * 0.3);
	const driveData = chartData.slice(0, driveWindow);
	const peakG = Math.max(...chartData);
	const peakInDrive = driveData.length > 0 ? Math.max(...driveData) : 0;
	const explosiveness = peakG > 0 ? Math.min(100, (peakInDrive / peakG) * 100) : 0;

	// Smoothness — inverse of jerk (rate of change of acceleration)
	const jerkValues = chartData.slice(1).map((v, i) => Math.abs(v - chartData[i]));
	const avgJerk =
		jerkValues.length > 0 ? jerkValues.reduce((s, j) => s + j, 0) / jerkValues.length : 0;
	const smoothness = Math.max(0, Math.min(100, 100 - (avgJerk / (peakG || 1)) * 200));

	// Velocity efficiency — area under curve vs ideal
	const peakSpeed = curve.speeds.length > 0 ? Math.max(...curve.speeds) : 0;
	const peakIdx = curve.speeds.indexOf(peakSpeed);
	if (peakIdx > 0 && peakSpeed > 0) {
		const actualArea = curve.speeds.slice(0, peakIdx).reduce((s, v) => s + v, 0);
		const idealArea = (peakSpeed * peakIdx) / 2;
		var efficiency = Math.min(100, (actualArea / (idealArea || 1)) * 100);
	} else {
		var efficiency = 0;
	}

	// Overall weighted score
	const overall = Math.round(
		reactionScore * 0.3 + explosiveness * 0.25 + smoothness * 0.25 + efficiency * 0.2
	);

	return {
		overall,
		reaction: Math.round(reactionScore),
		explosiveness: Math.round(explosiveness),
		smoothness: Math.round(smoothness),
		efficiency: Math.round(efficiency)
	};
}

// ─── Power estimation ─────────────────────────────────────────────────────────

const AIR_DENSITY = 1.225; // kg/m³ at sea level
const BMX_ROLLING_RESISTANCE = 0.006; // BMX tires on track
const BMX_DRAG_AREA = 0.35; // m² (CdA for BMX rider in start position)
const DRIVETRAIN_EFFICIENCY = 0.96; // 96% efficient drivetrain
const MAX_REALISTIC_BMX_POWER = 3000; // Watts - clamp unrealistic spikes
const POWER_SMOOTHING_WINDOW = 5; // samples

export interface PowerMetrics {
	peakW: number;
	avgW: number;
	estimated: true; // always mark as estimated
}

/**
 * Calculate cycling power from speed change (kinetic energy + resistances)
 * NOT from G-force - that measures system acceleration, not rider power output
 */
function calculateCyclingPower(
	previousSpeedKmh: number,
	currentSpeedKmh: number,
	deltaTimeSeconds: number,
	totalMassKg: number
): number {
	if (deltaTimeSeconds <= 0 || totalMassKg <= 0) return 0;

	const v1 = previousSpeedKmh / 3.6; // m/s
	const v2 = currentSpeedKmh / 3.6; // m/s
	const vAvg = (v1 + v2) / 2;

	// Power to change kinetic energy (acceleration/deceleration)
	const deltaKE = 0.5 * totalMassKg * (v2 ** 2 - v1 ** 2);
	const accelerationPower = deltaKE / deltaTimeSeconds;

	// Power to overcome rolling resistance
	const rollingPower = BMX_ROLLING_RESISTANCE * totalMassKg * GRAVITY * vAvg;

	// Power to overcome aerodynamic drag
	const aeroPower = 0.5 * AIR_DENSITY * BMX_DRAG_AREA * vAvg ** 3;

	// Total power at the wheel
	const wheelPower = accelerationPower + rollingPower + aeroPower;

	// Account for drivetrain losses to get rider power
	const riderPower = wheelPower / DRIVETRAIN_EFFICIENCY;

	// Clamp to realistic BMX values (prevents sensor spikes)
	return Math.max(0, Math.min(riderPower, MAX_REALISTIC_BMX_POWER));
}

export function estimatePower(
	chartData: number[], // Not used anymore, kept for API compatibility
	curve: SpeedCurve,
	totalMassKg: number
): PowerMetrics | null {
	if (!totalMassKg || !curve.speeds.length || curve.speeds.length < 2) return null;

	// Calculate power from speed changes
	const dt = curve.times[1] - curve.times[0]; // seconds between samples
	const rawPowers: number[] = [];

	for (let i = 1; i < curve.speeds.length; i++) {
		const power = calculateCyclingPower(curve.speeds[i - 1], curve.speeds[i], dt, totalMassKg);
		rawPowers.push(power);
	}

	// Apply smoothing to reduce noise
	const smoothedPowers: number[] = [];
	for (let i = 0; i < rawPowers.length; i++) {
		const start = Math.max(0, i - Math.floor(POWER_SMOOTHING_WINDOW / 2));
		const end = Math.min(rawPowers.length, i + Math.ceil(POWER_SMOOTHING_WINDOW / 2));
		const window = rawPowers.slice(start, end);
		const smoothed = window.reduce((s, p) => s + p, 0) / window.length;
		smoothedPowers.push(smoothed);
	}

	return {
		peakW: Math.round(Math.max(...smoothedPowers)),
		avgW: Math.round(smoothedPowers.reduce((s, p) => s + p, 0) / smoothedPowers.length),
		estimated: true
	};
}

// ─── Session consistency ──────────────────────────────────────────────────────

export interface ConsistencyResult {
	cv: number; // coefficient of variation %
	label: string;
	color: string;
	stdDev: number;
	mean: number;
}

export function scoreConsistency(values: number[]): ConsistencyResult | null {
	if (values.length < 2) return null;

	const mean = values.reduce((s, v) => s + v, 0) / values.length;
	const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
	const stdDev = Math.sqrt(variance);
	const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

	let label: string;
	let color: string;

	if (cv < 2) {
		label = 'Outstanding';
		color = '#3de8c8';
	} else if (cv < 3) {
		label = 'Excellent';
		color = '#3de8c8';
	} else if (cv < 5) {
		label = 'Good';
		color = '#f5a623';
	} else if (cv < 8) {
		label = 'Variable';
		color = '#ffcc44';
	} else {
		label = 'Inconsistent';
		color = '#ff4444';
	}

	return { cv: parseFloat(cv.toFixed(1)), label, color, stdDev, mean };
}

// ─── Impulse analysis ─────────────────────────────────────────────────────────

export interface ImpulseResult {
	totalImpulse: number;
	timeToHalfImpulse: number; // seconds
	timeToNinetyPctImpulse: number; // seconds
	frontLoadedScore: number; // ratio
	impulseEfficiency: number; // N·s per second
}

export function analyseImpulse(
	chartData: number[],
	elapsedMs: number,
	totalMassKg: number
): ImpulseResult | null {
	if (!totalMassKg || chartData.length < 2) return null;

	const dt = elapsedMs / 1000 / chartData.length;
	let totalImpulse = 0;
	const impulseData: { time: number; cumulative: number }[] = [];

	chartData.forEach((g, i) => {
		const force = totalMassKg * g * GRAVITY;
		const impulse = Math.max(0, force * dt);
		totalImpulse += impulse;
		impulseData.push({ time: i * dt, cumulative: totalImpulse });
	});

	const halfPoint = impulseData.find((d) => d.cumulative >= totalImpulse / 2);
	const ninetyPoint = impulseData.find((d) => d.cumulative >= totalImpulse * 0.9);
	const totalTime = elapsedMs / 1000;

	const timeToHalf = halfPoint?.time ?? totalTime;
	const timeToNinety = ninetyPoint?.time ?? totalTime;

	return {
		totalImpulse: parseFloat(totalImpulse.toFixed(2)),
		timeToHalfImpulse: parseFloat(timeToHalf.toFixed(3)),
		timeToNinetyPctImpulse: parseFloat(timeToNinety.toFixed(3)),
		frontLoadedScore: parseFloat((timeToHalf / (timeToNinety || 1)).toFixed(3)),
		impulseEfficiency: parseFloat((totalImpulse / totalTime).toFixed(2))
	};
}

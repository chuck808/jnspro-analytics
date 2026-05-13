import { round } from './math';
import type { SeriesPoint } from './types';

export const GRAVITY_MS2 = 9.80665;

// Physics constants for realistic power estimation
const AIR_DENSITY = 1.225; // kg/m³ at sea level
const BMX_ROLLING_RESISTANCE = 0.006; // BMX tires on track
const BMX_DRAG_AREA = 0.35; // m² (CdA for BMX rider in start position)
const DRIVETRAIN_EFFICIENCY = 0.96; // 96% efficient drivetrain
const MAX_REALISTIC_BMX_POWER = 3000; // Watts - clamp unrealistic spikes
const POWER_SMOOTHING_WINDOW = 5; // samples

export interface SpeedCurve {
  times: number[];
  speeds: number[];
  accels: number[];
  distances: number[];
}

export interface PowerEstimate {
  peakW: number;
  averageW: number;
  estimated: true;
  series: SeriesPoint[];
}

export interface ImpulseEstimate {
  totalImpulseNs: number;
  timeToHalfImpulseS: number;
  timeToNinetyPctImpulseS: number;
  frontLoadedScore: number;
  impulseEfficiency: number;
  series: SeriesPoint[];
}

export interface JerkEstimate {
  meanAbsolute: number;
  smoothnessScore: number;
  insight: string;
  series: SeriesPoint[];
}

export interface SpeedSplit {
  label: string;
  phase: string;
  timeS: number;
  distanceM: number;
}

export function computeSpeedCurve(
  chartData: number[], 
  elapsedMs: number, 
  biasMs2 = 0, 
  actualPeakSpeedKmh?: number | null
): SpeedCurve {
  if (!chartData || chartData.length < 2 || !elapsedMs) {
    return { times: [], speeds: [], accels: [], distances: [] };
  }

  const dt = (elapsedMs / 1000) / chartData.length;
  let velocityMs = 0;
  let distanceM = 0;

  const times: number[] = [];
  const speeds: number[] = [];
  const accels: number[] = [];
  const distances: number[] = [];

  chartData.forEach((g, i) => {
    // chart_data contains linearAccelG (forward-only, gravity-removed)
    // This gives us the SHAPE of the speed curve, but wrong magnitude
    const accelMs2 = g * GRAVITY_MS2 - biasMs2;
    velocityMs += accelMs2 * dt;
    distanceM += velocityMs * dt;
    times.push(i * dt);
    speeds.push(velocityMs * 3.6);
    accels.push(g);
    distances.push(distanceM);
  });

  // Scale the predicted curve to match firmware-measured reality
  if (actualPeakSpeedKmh && actualPeakSpeedKmh > 0 && speeds.length > 0) {
    const predictedPeak = Math.max(...speeds);
    if (predictedPeak > 0) {
      const scaleFactor = actualPeakSpeedKmh / predictedPeak;
      const scaledSpeeds = speeds.map(s => s * scaleFactor);
      const scaledDistances = distances.map(d => d * scaleFactor);
      return { times, speeds: scaledSpeeds, accels, distances: scaledDistances };
    }
  }

  return { times, speeds, accels, distances };
}

/**
 * Calculate cycling power from speed change (kinetic energy + resistances)
 * Uses physics-correct energy-based calculation, not system acceleration
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
  const rollingPower = BMX_ROLLING_RESISTANCE * totalMassKg * GRAVITY_MS2 * vAvg;

  // Power to overcome aerodynamic drag
  const aeroPower = 0.5 * AIR_DENSITY * BMX_DRAG_AREA * vAvg ** 3;

  // Total power at the wheel
  const wheelPower = accelerationPower + rollingPower + aeroPower;

  // Account for drivetrain losses to get rider power
  const riderPower = wheelPower / DRIVETRAIN_EFFICIENCY;

  // Clamp to realistic BMX values (prevents sensor spikes)
  return Math.max(0, Math.min(riderPower, MAX_REALISTIC_BMX_POWER));
}

export function estimatePower(chartData: number[], curve: SpeedCurve, totalMassKg: number | null | undefined): PowerEstimate | null {
  if (!totalMassKg || !curve.speeds.length || curve.speeds.length < 2) return null;

  // Calculate power from speed changes (physics-correct method)
  const dt = curve.times.length > 1 ? curve.times[1] - curve.times[0] : 0;
  if (dt <= 0) return null;

  const rawPowers: number[] = [];

  for (let i = 1; i < curve.speeds.length; i++) {
    const power = calculateCyclingPower(
      curve.speeds[i - 1],
      curve.speeds[i],
      dt,
      totalMassKg
    );
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

  // Build series for charting (offset by 1 since we start at i=1)
  const series: SeriesPoint[] = smoothedPowers.map((value, i) => ({
    timeS: curve.times[i + 1] ?? 0,
    value: Math.round(value)
  }));

  const peakW = Math.max(...smoothedPowers);
  const averageW = smoothedPowers.reduce((s, p) => s + p, 0) / smoothedPowers.length;

  return { 
    peakW: Math.round(peakW), 
    averageW: Math.round(averageW), 
    estimated: true as const, 
    series 
  };
}

export function analyseImpulse(chartData: number[], elapsedMs: number, totalMassKg: number | null | undefined): ImpulseEstimate | null {
  if (!totalMassKg || chartData.length < 2 || !elapsedMs) return null;

  const dt = (elapsedMs / 1000) / chartData.length;
  let totalImpulse = 0;
  const series: SeriesPoint[] = [];

  chartData.forEach((g, i) => {
    const forceN = totalMassKg * g * GRAVITY_MS2;
    totalImpulse += Math.max(0, forceN * dt);
    series.push({ timeS: i * dt, value: totalImpulse });
  });

  const half = series.find(p => p.value >= totalImpulse * 0.5);
  const ninety = series.find(p => p.value >= totalImpulse * 0.9);
  const totalTimeS = elapsedMs / 1000;
  const timeToHalf = half?.timeS ?? totalTimeS;
  const timeToNinety = ninety?.timeS ?? totalTimeS;

  return {
    totalImpulseNs: round(totalImpulse, 2)!,
    timeToHalfImpulseS: round(timeToHalf, 3)!,
    timeToNinetyPctImpulseS: round(timeToNinety, 3)!,
    frontLoadedScore: round(timeToHalf / (timeToNinety || 1), 3)!,
    impulseEfficiency: round(totalImpulse / totalTimeS, 2)!,
    series,
  };
}

export function computeJerk(chartData: number[], elapsedMs: number): JerkEstimate | null {
  if (!chartData || chartData.length < 3 || !elapsedMs) return null;
  const dt = (elapsedMs / 1000) / chartData.length;
  const values = chartData.slice(1).map((g, i) => ((g - chartData[i]) * GRAVITY_MS2) / dt);
  const series = values.map((value, i) => ({ timeS: (i + 1) * dt, value }));
  const abs = values.map(Math.abs);
  const meanAbsolute = abs.reduce((a, b) => a + b, 0) / abs.length;
  const peakG = Math.max(...chartData.map(Math.abs)) || 1;
  const smoothnessScore = Math.max(0, Math.min(100, 100 - (meanAbsolute / (peakG * GRAVITY_MS2)) * 10));

  let insight = 'Smooth acceleration profile.';
  if (smoothnessScore < 50) insight = 'Acceleration changes are abrupt; smoothness may be costing speed carry.';
  else if (smoothnessScore < 75) insight = 'Moderate acceleration variation; transition work may help.';

  return { meanAbsolute: round(meanAbsolute, 2)!, smoothnessScore: Math.round(smoothnessScore), insight, series };
}

/**
 * Calculate speed splits - time and distance to reach speed milestones
 * Migrated from legacy analytics.ts to Performance Engine
 */
export function calculateSpeedSplits(curve: SpeedCurve, peakSpeedKmh: number): SpeedSplit[] {
  if (!curve.times.length) return [];

  const thresholds = [
    { kmh: 10, label: '0 → 10 km/h', phase: 'Launch' },
    { kmh: 20, label: '0 → 20 km/h', phase: 'Early acceleration' },
    { kmh: 30, label: '0 → 30 km/h', phase: 'Mid acceleration' },
    { kmh: 40, label: '0 → 40 km/h', phase: 'Peak power' },
    { kmh: 50, label: '0 → 50 km/h', phase: 'Maximum power' },
    { kmh: 60, label: '0 → 60 km/h', phase: 'Elite speed' },
  ].filter(t => t.kmh <= peakSpeedKmh * 0.95);

  return thresholds.map(t => {
    const idx = curve.speeds.findIndex(s => s >= t.kmh);
    if (idx === -1) return null;
    return {
      label: t.label,
      phase: t.phase,
      timeS: parseFloat(curve.times[idx].toFixed(3)),
      distanceM: parseFloat(curve.distances[idx].toFixed(2)),
    };
  }).filter(Boolean) as SpeedSplit[];
}

/**
 * Classify speed profile based on when peak speed is reached
 * Migrated from legacy analytics.ts to Performance Engine
 */
export function classifySpeedProfile(timeToPeakMs: number | null, elapsedMs: number): string {
  if (!timeToPeakMs || !elapsedMs) return '—';
  const pct = (timeToPeakMs / elapsedMs) * 100;
  if (pct < 55) return 'Explosive';
  if (pct < 75) return 'Balanced';
  return 'Late Peak';
}

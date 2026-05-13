import { clamp, round } from './math';
import type { SpeedCurve } from './physics';
import type { TechniqueAnalysis } from './types';

const reactionBenchmarks: Record<string, number> = {
  novice: 350,
  intermediate: 300,
  expert: 250,
  elite: 220,
  grom: 420,
  rider: 320,
  coach: 260,
};

export function scoreTechnique(
  reactionMs: number | null | undefined,
  chartData: number[],
  curve: SpeedCurve,
  riderLevel?: string | null
): TechniqueAnalysis | null {
  if (!chartData.length || !reactionMs) return null;

  const benchmark = reactionBenchmarks[riderLevel ?? 'intermediate'] ?? 300;
  const reaction = clamp((benchmark / reactionMs) * 100);

  const driveWindow = Math.max(1, Math.floor(chartData.length * 0.3));
  const driveData = chartData.slice(0, driveWindow);
  const peakG = Math.max(...chartData.map(v => Math.abs(v))) || 1;
  const peakInDrive = Math.max(...driveData.map(v => Math.abs(v)));
  const explosiveness = clamp((peakInDrive / peakG) * 100);

  const jerkValues = chartData.slice(1).map((v, i) => Math.abs(v - chartData[i]));
  const avgJerk = jerkValues.length ? jerkValues.reduce((s, j) => s + j, 0) / jerkValues.length : 0;
  const smoothness = clamp(100 - (avgJerk / peakG) * 200);

  const peakSpeed = curve.speeds.length ? Math.max(...curve.speeds) : 0;
  const peakIdx = curve.speeds.indexOf(peakSpeed);
  let efficiency = 0;
  if (peakIdx > 0 && peakSpeed > 0) {
    const actualArea = curve.speeds.slice(0, peakIdx).reduce((s, v) => s + v, 0);
    const idealTriangleArea = (peakSpeed * peakIdx) / 2;
    efficiency = clamp((actualArea / (idealTriangleArea || 1)) * 100);
  }

  const overall = reaction * 0.3 + explosiveness * 0.25 + smoothness * 0.25 + efficiency * 0.2;

  return {
    overall: Math.round(overall),
    reaction: Math.round(reaction),
    explosiveness: Math.round(explosiveness),
    smoothness: Math.round(smoothness),
    efficiency: Math.round(efficiency),
    phaseAssessment: buildPhaseAssessment(explosiveness, smoothness, efficiency),
  };
}

function buildPhaseAssessment(explosiveness: number, smoothness: number, efficiency: number): string {
  if (explosiveness > 80 && smoothness > 75 && efficiency > 75) return 'Strong launch, smooth transition and good speed carry.';
  if (explosiveness > 80 && efficiency < 65) return 'Explosive launch, but speed carry could improve after the first phase.';
  if (explosiveness < 65 && smoothness > 75) return 'Smooth run, but the first drive phase needs more force.';
  if (smoothness < 60) return 'Acceleration is choppy; focus on smoother power delivery.';
  return 'Solid run with room to refine launch force and speed carry.';
}

export function scoreConsistencyFromCv(cv: number | null) {
  if (cv === null) return { score: null, label: null };
  const score = Math.round(clamp(100 - cv * 10));
  let label = 'Inconsistent';
  if (cv < 2) label = 'Outstanding';
  else if (cv < 3) label = 'Excellent';
  else if (cv < 5) label = 'Good';
  else if (cv < 8) label = 'Variable';
  return { score, label };
}

/**
 * Full consistency scoring from raw values
 * Migrated from legacy analytics.ts
 */
export interface ConsistencyResult {
  cv: number;
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

  if (cv < 2) { label = 'Outstanding'; color = '#3de8c8'; }
  else if (cv < 3) { label = 'Excellent'; color = '#3de8c8'; }
  else if (cv < 5) { label = 'Good'; color = '#f5a623'; }
  else if (cv < 8) { label = 'Variable'; color = '#ffcc44'; }
  else { label = 'Inconsistent'; color = '#ff4444'; }

  return { cv: parseFloat(cv.toFixed(1)), label, color, stdDev, mean };
}

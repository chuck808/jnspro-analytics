import type { DetailLevel } from './types';

export type RiderBenchmarkLevel = DetailLevel | 'novice' | 'intermediate' | 'expert' | 'elite';

export interface PerformanceBenchmarks {
  reactionMs: {
    excellent: number;
    good: number;
    needsWork: number;
  };
  peakG: {
    good: number;
    excellent: number;
  };
  timeTo90ImpulseS: {
    excellent: number;
    good: number;
    needsWork: number;
  };
  smoothnessScore: {
    good: number;
    excellent: number;
  };
  speedCarryRatio: {
    good: number;
    excellent: number;
  };
}

const DEFAULT_BENCHMARKS: Record<string, PerformanceBenchmarks> = {
  grom: {
    reactionMs: { excellent: 280, good: 380, needsWork: 520 },
    peakG: { good: 1.2, excellent: 1.8 },
    timeTo90ImpulseS: { excellent: 1.1, good: 1.5, needsWork: 2.0 },
    smoothnessScore: { good: 65, excellent: 82 },
    speedCarryRatio: { good: 0.72, excellent: 0.84 },
  },
  rider: {
    reactionMs: { excellent: 230, good: 320, needsWork: 430 },
    peakG: { good: 1.8, excellent: 2.4 },
    timeTo90ImpulseS: { excellent: 0.95, good: 1.3, needsWork: 1.8 },
    smoothnessScore: { good: 68, excellent: 85 },
    speedCarryRatio: { good: 0.76, excellent: 0.88 },
  },
  intermediate: {
    reactionMs: { excellent: 230, good: 320, needsWork: 430 },
    peakG: { good: 1.8, excellent: 2.4 },
    timeTo90ImpulseS: { excellent: 0.95, good: 1.3, needsWork: 1.8 },
    smoothnessScore: { good: 68, excellent: 85 },
    speedCarryRatio: { good: 0.76, excellent: 0.88 },
  },
  expert: {
    reactionMs: { excellent: 200, good: 280, needsWork: 380 },
    peakG: { good: 2.1, excellent: 2.8 },
    timeTo90ImpulseS: { excellent: 0.85, good: 1.15, needsWork: 1.6 },
    smoothnessScore: { good: 72, excellent: 88 },
    speedCarryRatio: { good: 0.8, excellent: 0.9 },
  },
  elite: {
    reactionMs: { excellent: 180, good: 250, needsWork: 340 },
    peakG: { good: 2.3, excellent: 3.0 },
    timeTo90ImpulseS: { excellent: 0.8, good: 1.05, needsWork: 1.45 },
    smoothnessScore: { good: 75, excellent: 90 },
    speedCarryRatio: { good: 0.82, excellent: 0.92 },
  },
  coach: {
    reactionMs: { excellent: 180, good: 250, needsWork: 340 },
    peakG: { good: 2.3, excellent: 3.0 },
    timeTo90ImpulseS: { excellent: 0.8, good: 1.05, needsWork: 1.45 },
    smoothnessScore: { good: 75, excellent: 90 },
    speedCarryRatio: { good: 0.82, excellent: 0.92 },
  },
};

export function getBenchmarks(level?: string | null): PerformanceBenchmarks {
  return DEFAULT_BENCHMARKS[level ?? 'rider'] ?? DEFAULT_BENCHMARKS.rider;
}

export function scoreAgainstLowerIsBetter(value: number | null | undefined, excellent: number, needsWork: number): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value <= excellent) return 100;
  if (value >= needsWork) return 35;
  const ratio = (needsWork - value) / (needsWork - excellent);
  return Math.round(35 + ratio * 65);
}

export function scoreAgainstHigherIsBetter(value: number | null | undefined, good: number, excellent: number): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value >= excellent) return 100;
  if (value <= 0) return 0;
  if (value < good) return Math.round(Math.max(25, (value / good) * 70));
  const ratio = (value - good) / (excellent - good);
  return Math.round(70 + ratio * 30);
}

export function labelScore(score: number | null | undefined): 'excellent' | 'good' | 'developing' | 'needs-work' | 'unknown' {
  if (score === null || score === undefined) return 'unknown';
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'developing';
  return 'needs-work';
}

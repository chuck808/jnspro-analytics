import { METRIC_TOLERANCES, type MetricTolerance } from './metricTolerances';

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length);
}

function score(stdDev: number, tol: MetricTolerance): number {
  if (stdDev <= tol.excellent) return 100;
  if (stdDev >= tol.poor) return 0;

  return 100 - ((stdDev - tol.excellent) / (tol.poor - tol.excellent)) * 100;
}

export interface RunData {
  reactionTime?: number | null;
  peakSpeed?: number | null;
  peakG?: number | null;
}

export interface RepeatabilityAnalysis {
  reactionStd: number;
  speedStd: number;
  reactionScore: number;
  speedScore: number;
  overall: number;
}

export function analyseRepeatability(runs: RunData[]): RepeatabilityAnalysis {
  const reactions = runs.map(r => r.reactionTime).filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const speeds = runs.map(r => r.peakSpeed).filter((v): v is number => typeof v === 'number' && !isNaN(v));

  const reactionStd = std(reactions);
  const speedStd = std(speeds);

  const reactionScore = reactions.length > 0 ? score(reactionStd, METRIC_TOLERANCES.reactionTime) : 0;
  const speedScore = speeds.length > 0 ? score(speedStd, METRIC_TOLERANCES.speed) : 0;

  const overall = reactions.length > 0 && speeds.length > 0 
    ? (reactionScore + speedScore) / 2 
    : reactionScore || speedScore || 0;

  return {
    reactionStd,
    speedStd,
    reactionScore,
    speedScore,
    overall
  };
}

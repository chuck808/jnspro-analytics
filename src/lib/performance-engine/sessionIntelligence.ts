import { analyseRepeatability, type RunData, type RepeatabilityAnalysis } from './repeatability';
import { analyseFatigue, type FatigueAnalysis } from './fatigue';
import { analyseBestVsAverage, type BestVsAverageAnalysis } from './bestVsAverage';
import { detectDropOff, type DropOffAnalysis } from './dropoff';
import { suggestSetLength, type SetLengthSuggestion } from './setLength';

export interface SessionIntelligenceReport {
  repeatability: RepeatabilityAnalysis;
  fatigue: FatigueAnalysis;
  bestVsAvg: BestVsAverageAnalysis | null;
  dropOff: DropOffAnalysis | null;
  setLength: SetLengthSuggestion;
  sessionQuality: number;
  headline: string;
  recommendations: string[];
}

export function analyseSessionIntelligence(runs: RunData[]): SessionIntelligenceReport {
  const repeat = analyseRepeatability(runs);
  const speeds = runs.map(r => r.peakSpeed).filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const fatigue = analyseFatigue(speeds);

  // v7.2 additions
  const bestVsAvg = analyseBestVsAverage(speeds);
  const dropOff = detectDropOff(speeds);
  const setLength = suggestSetLength(dropOff, runs.length);

  const quality = repeat.overall - (fatigue.trend === 'declining' ? 20 : 0);

  return {
    repeatability: repeat,
    fatigue,
    bestVsAvg,
    dropOff,
    setLength,
    sessionQuality: Math.max(0, quality),
    headline: buildHeadline(repeat, fatigue, dropOff),
    recommendations: buildRecommendations(repeat, fatigue, bestVsAvg, dropOff)
  };
}

function buildHeadline(rep: RepeatabilityAnalysis, fat: FatigueAnalysis, dropOff: DropOffAnalysis | null): string {
  if (dropOff) return `Performance drops after run ${dropOff.dropOffRun}`;
  if (fat.trend === 'declining') return 'Performance drops across runs';
  if (rep.overall > 80) return 'Very consistent session';
  if (rep.overall < 60) return 'Inconsistent session';

  return 'Mixed session quality';
}

function buildRecommendations(
  rep: RepeatabilityAnalysis,
  fat: FatigueAnalysis,
  bestVsAvg: BestVsAverageAnalysis | null,
  dropOff: DropOffAnalysis | null
): string[] {
  const rec: string[] = [];

  // v7.2 priority: inconsistency detection
  if (bestVsAvg?.consistencyType === 'inconsistent') {
    rec.push('You are chasing peak runs — focus on repeatability');
  }

  // v7.2 priority: optimal set length
  if (dropOff) {
    rec.push(`Stop sets around run ${dropOff.dropOffRun - 1}`);
  }

  // Original v7.1 recommendations
  if (rep.overall < 60 && bestVsAvg?.consistencyType !== 'inconsistent') {
    rec.push('Focus on repeatable starts, not peak runs');
  }

  if (fat.trend === 'declining' && !dropOff) {
    rec.push('Increase recovery between efforts');
  }

  if (rep.overall > 80 && fat.trend === 'stable' && !dropOff) {
    rec.push('Excellent session quality - maintain this approach');
  }

  if (fat.trend === 'improving') {
    rec.push('Performance improved through session - good warm-up progression');
  }

  return rec;
}

/**
 * v8.3 Controlled Language System - Phrases
 * 
 * Dictionary of reusable coaching phrases
 */

import type { PhraseOptions } from './types';

export const HEADLINES = {
  calibrationLimited: 'Calibration limited — use technique patterns, not speed or power',
  excellentConsistency: 'Excellent consistency — highly repeatable performance',
  goodConsistency: 'Good consistency — reliable execution',
  variableConsistency: 'Variable consistency — execution needs attention',
  lowRunCount: 'Limited data — initial patterns only',
  fatigue: 'Fatigue detected — quality dropped mid-set',
  strongStart: 'Strong start — maintain this quality',
  peaksWithoutRepeatability: 'High peaks but low repeatability',
  steadyProgress: 'Steady progress across metrics',
  mixedSignals: 'Mixed signals — some metrics improving, others declining'
};

export const IMPACTS = {
  calibrationLimited: 'Some derived metrics appear unreliable, so coaching should focus on trusted signals only.',
  consistencyHigh: 'Repeatable performance indicates solid technique and good mental/physical state.',
  consistencyLow: 'Wide variation between runs suggests inconsistent execution or varying conditions.',
  fewRuns: 'Small sample size limits pattern detection and confidence in conclusions.',
  fatigueDetected: 'Performance decline within the session suggests energy management or technique breakdown.',
  gapWide: 'Large gap between best and average suggests occasional breakthrough runs but inconsistent baseline.',
  reactionImproving: 'Quicker gate reactions enable earlier power application and better overall runs.',
  speedImproving: 'Higher peak speeds indicate more effective power transfer and technique execution.'
};

export const WHY_MATTERS = {
  calibration: 'Speed and power depend on calibration, time units and integration quality. If those are off, absolute values can mislead.',
  consistency: 'Consistent runs build confidence and allow progressive training. High variation makes it hard to know what is working.',
  earlyData: 'Early patterns can guide focus, but should not drive major decisions until confirmed with more sessions.',
  fatigue: 'Training quality matters more than quantity. If quality drops, further reps may reinforce poor patterns.',
  repeatability: 'A single great run is less valuable than repeatable solid runs. Consistency builds competition readiness.',
  technique: 'Observable technique patterns (wheelie control, timing, rhythm) remain valid even when speed/power readings are questionable.'
};

export const ACTIONS = {
  useTechniqueOnly: 'Use this run for technique review, not absolute speed or power judgement.',
  focusOnConsistency: 'Focus on narrowing the gap between best and average runs.',
  maintainQuality: 'Maintain current approach — quality is solid.',
  addressFatigue: 'Consider shorter sets or more recovery to maintain quality throughout.',
  keepLogging: 'Keep logging sessions to build confidence in trend analysis.',
  reviewTechnique: 'Review technique fundamentals — consistency starts with repeatable execution.',
  celebrateProgress: 'Acknowledge progress while staying focused on continuous improvement.',
  investigateVariation: 'Investigate what differs between your best and average runs.'
};

export const WATCH_FOR = {
  calibrationImprovement: 'speed and power values returning to realistic ranges after calibration checks',
  consistencyImprovement: 'narrowing gap between best and average performance',
  fatiguePattern: 'whether quality drop persists or was a one-time occurrence',
  trendConfirmation: 'pattern confirmation across multiple sessions',
  techniqueTransfer: 'whether technique improvements translate to measurable performance gains'
};

/**
 * Generate a run-count qualifier phrase
 */
export function runCountQualifier(count: number): string {
  if (count < 3) return 'Very limited data';
  if (count < 5) return 'Limited data';
  if (count < 8) return 'Moderate sample size';
  return 'Good sample size';
}

/**
 * Generate confidence phrase
 */
export function confidencePhrase(level: 'low' | 'moderate' | 'high'): string {
  switch (level) {
    case 'low': return 'Low confidence — early signal only';
    case 'moderate': return 'Moderate confidence — pattern emerging';
    case 'high': return 'High confidence — clear pattern';
  }
}

/**
 * v8.4 Controlled Language System - Phrases
 *
 * Dictionary of reusable coaching phrases.
 *
 * Design rules:
 *   - No causal language ("X causes Y") — only associative ("X appears linked to Y")
 *   - No prescriptive technique instruction — observations and focus areas only
 *   - Consistent across rider levels — plain English that a grom and a coach both read
 *   - Context-aware variants exist for rideFeel, sessionFocus, trackSurface, weather
 */

import type { PhraseOptions } from './types';

// ── Core headlines ────────────────────────────────────────────────────────────

export const HEADLINES = {
  calibrationLimited:        'Calibration limited — use technique patterns, not speed or power',
  excellentConsistency:      'Excellent consistency — highly repeatable performance',
  goodConsistency:           'Good consistency — reliable execution',
  variableConsistency:       'Variable consistency — execution needs attention',
  lowRunCount:               'Limited data — initial patterns only',
  fatigue:                   'Fatigue detected — quality dropped mid-set',
  strongStart:               'Strong start — maintain this quality',
  peaksWithoutRepeatability: 'High peaks but low repeatability',
  steadyProgress:            'Steady progress across metrics',
  mixedSignals:              'Mixed signals — some metrics improving, others declining',
};

// ── Core impacts ──────────────────────────────────────────────────────────────

export const IMPACTS = {
  calibrationLimited: 'Some derived metrics appear unreliable, so coaching should focus on trusted signals only.',
  consistencyHigh:    'Repeatable performance indicates solid technique and good mental/physical state.',
  consistencyLow:     'Wide variation between runs suggests inconsistent execution or varying conditions.',
  fewRuns:            'Small sample size limits pattern detection and confidence in conclusions.',
  fatigueDetected:    'Performance decline within the session suggests energy management or technique breakdown.',
  gapWide:            'Large gap between best and average suggests occasional breakthrough runs but inconsistent baseline.',
  reactionImproving:  'Quicker gate reactions enable earlier power application and better overall runs.',
  speedImproving:     'Higher peak speeds indicate more effective power transfer and technique execution.',
};

// ── Core why-this-matters ─────────────────────────────────────────────────────

export const WHY_MATTERS = {
  calibration:  'Speed and power depend on calibration, time units and integration quality. If those are off, absolute values can mislead.',
  consistency:  'Consistent runs build confidence and allow progressive training. High variation makes it hard to know what is working.',
  earlyData:    'Early patterns can guide focus, but should not drive major decisions until confirmed with more sessions.',
  fatigue:      'Training quality matters more than quantity. If quality drops, further reps may reinforce poor patterns.',
  repeatability:'A single great run is less valuable than repeatable solid runs. Consistency builds competition readiness.',
  technique:    'Observable technique patterns (wheelie control, timing, rhythm) remain valid even when speed/power readings are questionable.',
};

// ── Core actions ──────────────────────────────────────────────────────────────

export const ACTIONS = {
  useTechniqueOnly:    'Use this session for technique review, not absolute speed or power judgement.',
  focusOnConsistency:  'Focus on narrowing the gap between best and average runs.',
  maintainQuality:     'Maintain current approach — quality is solid.',
  addressFatigue:      'Consider shorter sets or more recovery to maintain quality throughout.',
  keepLogging:         'Keep logging sessions to build confidence in trend analysis.',
  reviewTechnique:     'Review technique fundamentals — consistency starts with repeatable execution.',
  celebrateProgress:   'Acknowledge progress while staying focused on continuous improvement.',
  investigateVariation:'Investigate what differs between your best and average runs.',
};

// ── Core watch-fors ───────────────────────────────────────────────────────────

export const WATCH_FOR = {
  calibrationImprovement: 'speed and power values returning to realistic ranges after calibration checks',
  consistencyImprovement: 'narrowing gap between best and average performance',
  fatiguePattern:         'whether quality drop persists or was a one-time occurrence',
  trendConfirmation:      'pattern confirmation across multiple sessions',
  techniqueTransfer:      'whether technique improvements translate to measurable performance gains',
};

// ── RideFeel context phrases ──────────────────────────────────────────────────
//
// These are used to add a sentence acknowledging the rider's subjective feel
// and — crucially — flagging dissonance when feel and data disagree.
//
// Dissonance is the most valuable signal here. "Felt peak, data says variable"
// or "felt off, data says consistent" are both worth saying explicitly.

export type RideFeel = 'off' | 'solid' | 'good' | 'dialled' | 'peak';
export type ConsistencyBand = 'excellent' | 'good' | 'variable' | 'poor';

interface RideFeelContext {
  feel: RideFeel;
  consistency: ConsistencyBand;
  fatigueDetected: boolean;
}

/**
 * Returns a 1–2 sentence feel/data alignment note.
 * Returns null when there is nothing meaningful to say (no feel set, or
 * feel and data broadly agree with nothing interesting to surface).
 */
export function buildRideFeelNote(ctx: RideFeelContext): string | null {
  const { feel, consistency, fatigueDetected } = ctx;

  // ── Dissonance cases — these are always worth saying ──────────────────────

  // Felt great, data says otherwise
  if ((feel === 'peak' || feel === 'dialled') && (consistency === 'variable' || consistency === 'poor')) {
    return fatigueDetected
      ? 'You logged this as a peak day, but the data shows quality dropping through the set — worth noting the gap between feel and output.'
      : 'You logged this as a strong day, but the numbers show more variation than usual. That gap between how it felt and what the data shows is worth paying attention to.';
  }

  // Felt off, data held up
  if (feel === 'off' && (consistency === 'excellent' || consistency === 'good')) {
    return 'You logged this as an off day, but the starts were actually solid — the data held up better than it felt. That kind of resilience is worth noting.';
  }

  // Felt off, data also poor — validate and reframe
  if (feel === 'off' && (consistency === 'variable' || consistency === 'poor')) {
    return 'You logged this as an off day, and the data reflects that. Days like this happen — what matters is recognising it and not overtraining through it.';
  }

  // Felt solid/good, data excellent — quiet positive confirmation
  if ((feel === 'solid' || feel === 'good') && consistency === 'excellent') {
    return 'You logged this as a solid session, and the consistency numbers back that up.';
  }

  // Felt peak/dialled, data also excellent — strong alignment
  if ((feel === 'peak' || feel === 'dialled') && (consistency === 'excellent' || consistency === 'good')) {
    return 'You logged this as a peak day and the data agrees — starts were tight and repeatable throughout.';
  }

  // No strong signal either way — omit rather than pad
  return null;
}

// ── SessionFocus alignment phrases ───────────────────────────────────────────
//
// Used when the session had a declared focus. Two cases:
//   1. Focus area performed well — positive alignment
//   2. Focus area was the weakest — reframe as useful diagnostic
//   3. Different area was the standout — surface the divergence

export type SessionFocus =
  | 'reaction-time' | 'explosiveness' | 'speed-carry'
  | 'technique' | 'endurance' | 'consistency'
  | 'recovery' | 'testing';

export type PerformanceArea = 'reaction' | 'explosiveness' | 'speedCarry' | 'smoothness' | 'consistency';

interface FocusAlignmentContext {
  focus: SessionFocus;
  strongAreas: PerformanceArea[];   // scored >= 75
  weakAreas: PerformanceArea[];     // scored < 60
  isTesting: boolean;
}

/**
 * Returns a focus-alignment note when the declared session focus and the
 * data tell an interesting story together.
 */
export function buildFocusAlignmentNote(ctx: FocusAlignmentContext): string | null {
  const { focus, strongAreas, weakAreas, isTesting } = ctx;

  if (isTesting) {
    return 'This was a testing session — consistency and repeatability numbers reflect intentional variation, not a baseline problem. Run a standard session before drawing conclusions.';
  }

  if (focus === 'recovery') {
    return 'Recovery session — use these numbers as a baseline check rather than a performance target.';
  }

  // Map focus to the relevant performance area
  const focusArea: PerformanceArea | null =
    focus === 'reaction-time'  ? 'reaction'      :
    focus === 'explosiveness'  ? 'explosiveness' :
    focus === 'speed-carry'    ? 'speedCarry'    :
    focus === 'consistency'    ? 'consistency'   :
    focus === 'technique'      ? 'smoothness'    :
    null;

  if (!focusArea) return null;

  const focusWasStrong = strongAreas.includes(focusArea);
  const focusWasWeak   = weakAreas.includes(focusArea);

  if (focusWasStrong) {
    const focusLabel = FOCUS_LABELS[focusArea];
    return `The session focus was ${FOCUS_DISPLAY[focus]}, and that area came through — ${focusLabel} was one of the stronger dimensions today.`;
  }

  if (focusWasWeak) {
    return `The session focus was ${FOCUS_DISPLAY[focus]}, and it was the area that needs the most work today. That makes this session a useful baseline — the gap is now visible.`;
  }

  // Focus area was middling — check if something else stood out
  const unexpectedStrength = strongAreas.find(a => a !== focusArea);
  if (unexpectedStrength) {
    return `The session focus was ${FOCUS_DISPLAY[focus]}, but ${FOCUS_LABELS[unexpectedStrength]} was actually the standout today. Worth knowing.`;
  }

  return null;
}

const FOCUS_DISPLAY: Record<SessionFocus, string> = {
  'reaction-time': 'reaction time',
  'explosiveness': 'explosiveness',
  'speed-carry':   'speed carry',
  'technique':     'technique',
  'endurance':     'endurance',
  'consistency':   'consistency',
  'recovery':      'recovery',
  'testing':       'testing',
};

const FOCUS_LABELS: Record<PerformanceArea, string> = {
  reaction:       'gate reaction',
  explosiveness:  'explosive drive',
  speedCarry:     'speed carry',
  smoothness:     'force smoothness',
  consistency:    'consistency',
};

// ── Surface and weather modifiers ─────────────────────────────────────────────
//
// Short qualifiers appended to the narrative when conditions are relevant.
// Not shown for neutral conditions (dry concrete, sunny, indoor) — only
// when the conditions meaningfully affect how the numbers should be read.

export type TrackSurface = 'dry-concrete' | 'dry-asphalt' | 'damp' | 'wet' | 'muddy' | 'indoor';
export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'light-rain' | 'rain' | 'windy' | 'cold' | 'hot';

export function buildConditionsNote(
  surface: TrackSurface | null,
  weather: WeatherCondition | null
): string | null {
  const parts: string[] = [];

  if (surface === 'wet' || surface === 'muddy') {
    parts.push(`Surface was ${surface} — speed and traction-dependent metrics should be compared against other ${surface} sessions only.`);
  } else if (surface === 'damp') {
    parts.push('Surface was damp — treat speed metrics as indicative rather than definitive.');
  }

  if (weather === 'windy') {
    parts.push('Windy conditions can affect speed carry and timing — flag if this appears in multiple sessions.');
  } else if (weather === 'cold') {
    parts.push('Cold conditions — reaction time and muscle performance can be affected; compare against similar-temperature sessions.');
  } else if (weather === 'hot') {
    parts.push('Hot conditions — fatigue may accumulate faster than usual; watch drop-off patterns.');
  } else if (weather === 'rain' || weather === 'light-rain') {
    parts.push('Wet weather — speed and grip-dependent metrics are less reliable today.');
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

// ── Correlation insight connector ─────────────────────────────────────────────
//
// When the analytics engine has established a pattern (e.g. "dry concrete
// sessions consistently produce better reaction times"), this adds a
// sentence connecting today's session to that pattern.
//
// Deliberately cautious — only fires when the insight is actionable and the
// current session's conditions match the established pattern.

export interface CorrelationHint {
  variable: string;       // e.g. 'track_surface', 'weather_condition'
  value: string;          // e.g. 'dry-concrete', 'cold'
  metric: string;         // e.g. 'reaction time', 'consistency'
  direction: 'better' | 'worse';
  strength: 'strong' | 'moderate' | 'weak';
  sessionCount: number;
}

export function buildCorrelationNote(
  hints: CorrelationHint[],
  currentSurface: string | null,
  currentWeather: string | null
): string | null {
  // Only use moderate+ strength hints with enough sessions
  const usable = hints.filter(h =>
    h.strength !== 'weak' &&
    h.sessionCount >= 8 &&
    (
      (h.variable === 'track_surface'      && h.value === currentSurface) ||
      (h.variable === 'weather_condition'  && h.value === currentWeather)
    )
  );

  if (usable.length === 0) return null;

  // Lead with the most session-rich hint
  const best = usable.sort((a, b) => b.sessionCount - a.sessionCount)[0];
  const condLabel = best.variable === 'track_surface'
    ? surfaceLabel(best.value)
    : weatherLabel(best.value);

  const qualifier = best.strength === 'strong'
    ? `Your data shows a consistent pattern`
    : `There's an emerging pattern in your data`;

  const direction = best.direction === 'better' ? 'tend to be stronger' : 'tend to be lower';

  return `${qualifier}: your ${best.metric} ${direction} on ${condLabel}. Today fits that pattern — worth tracking whether it holds.`;
}

function surfaceLabel(v: string): string {
  const map: Record<string, string> = {
    'dry-concrete': 'dry concrete',
    'dry-asphalt':  'dry asphalt',
    'damp':         'damp surfaces',
    'wet':          'wet surfaces',
    'muddy':        'muddy conditions',
    'indoor':       'indoor tracks',
  };
  return map[v] ?? v;
}

function weatherLabel(v: string): string {
  const map: Record<string, string> = {
    'sunny':         'sunny days',
    'partly-cloudy': 'partly cloudy conditions',
    'cloudy':        'overcast days',
    'light-rain':    'light rain',
    'rain':          'rainy conditions',
    'windy':         'windy conditions',
    'cold':          'cold days',
    'hot':           'hot days',
  };
  return map[v] ?? v;
}

// ── Utility functions ─────────────────────────────────────────────────────────

export function runCountQualifier(count: number): string {
  if (count < 3) return 'Very limited data';
  if (count < 5) return 'Limited data';
  if (count < 8) return 'Moderate sample size';
  return 'Good sample size';
}

export function confidencePhrase(level: 'low' | 'moderate' | 'high'): string {
  switch (level) {
    case 'low':      return 'Low confidence — early signal only';
    case 'moderate': return 'Moderate confidence — pattern emerging';
    case 'high':     return 'High confidence — clear pattern';
  }
}

/**
 * Map a numeric consistency score to a band for use in feel/data comparisons.
 */
export function consistencyBand(score: number | null | undefined): ConsistencyBand {
  if (score == null) return 'good'; // default — don't fire dissonance without data
  if (score >= 80)   return 'excellent';
  if (score >= 60)   return 'good';
  if (score >= 40)   return 'variable';
  return 'poor';
}
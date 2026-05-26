import { shouldShowPower } from '$lib/performance-engine';
import type { DetailLevel, SessionAnalysis } from '$lib/performance-engine';
import type { AnalysisView, DisplayInsight, DisplayMetric } from './types';

export function createAnalysisView(analysis: SessionAnalysis, level: DetailLevel): AnalysisView {
  switch (level) {
    case 'grom': return createGromView(analysis);
    case 'rider': return createRiderView(analysis);
    case 'elite': return createEliteView(analysis);
    case 'coach': return createCoachView(analysis);
  }
}

function createGromView(analysis: SessionAnalysis): AnalysisView {
  const s = analysis.summary;
  const metrics: DisplayMetric[] = [
    metric('Best reaction', formatMs(s.bestReactionMs), 'How quickly the rider reacted to the gate.', 'grom'),
    metric('Best run', s.bestRunNumber ? `Run ${s.bestRunNumber}` : '—', 'The run with the quickest reaction.', 'grom'),
    metric('Consistency', s.consistencyLabel ?? '—', 'How repeatable the starts were.', 'grom'),
  ];

  return {
    level: 'grom',
    headline: buildSimpleHeadline(analysis),
    summary: 'Simple view: focus on what went well and one thing to practise next.',
    metrics,
    insights: simpleInsights(analysis),
    nextActions: analysis.recommendations.slice(0, 2).map(r => r.message),
    showCharts: { acceleration: false, speed: true, impulse: false, power: false, jerk: false },
    raw: analysis,
  };
}

function createRiderView(analysis: SessionAnalysis): AnalysisView {
  const s = analysis.summary;
  const t = analysis.selectedRun?.technique;
  const metrics: DisplayMetric[] = [
    metric('Best reaction', formatMs(s.bestReactionMs), 'Fastest reaction in the session.', 'rider'),
    metric('Average reaction', formatMs(s.averageReactionMs), 'Typical reaction across the session.', 'rider'),
    metric('Peak G', formatNumber(s.peakG, 'g'), 'Highest acceleration spike.', 'rider'),
    metric('Peak speed', formatNumber(s.peakSpeedKmh, 'km/h'), 'Estimated highest speed from the acceleration trace.', 'rider'),
    metric('Technique score', score(t?.overall), 'Combined reaction, explosiveness, smoothness and efficiency.', 'rider'),
  ];

  return {
    level: 'rider',
    headline: buildRiderHeadline(analysis),
    summary: 'Rider view: enough detail to understand performance without drowning in maths.',
    metrics,
    insights: performanceInsights(analysis),
    nextActions: analysis.recommendations.slice(0, 3).map(r => r.message),
    showCharts: { acceleration: true, speed: true, impulse: false, power: false, jerk: false },
    raw: analysis,
  };
}

function createEliteView(analysis: SessionAnalysis): AnalysisView {
  const s = analysis.summary;
  const p = analysis.selectedRun?.physics;
  const t = analysis.selectedRun?.technique;
  const metrics: DisplayMetric[] = [
    metric('Best reaction', formatMs(s.bestReactionMs), 'Fastest gate reaction.', 'elite'),
    metric('Consistency score', score(s.consistencyScore), 'Derived from spread in reaction times.', 'elite'),
    metric('Peak G', formatNumber(s.peakG, 'g'), 'Highest acceleration in the selected session.', 'elite'),
    metric('Peak speed', analysis.hasCalibrationWarning ? 'Check calibration' : formatNumber(s.peakSpeedKmh, 'km/h'), 'Integrated from acceleration data.', 'elite'),
    metric('Impulse', formatNumber(p?.impulse?.totalImpulseNs, 'N·s'), 'Estimated force over time using total mass.', 'elite'),
    metric('Time to 90% impulse', formatNumber(p?.impulse?.timeToNinetyPctImpulseS, 's'), 'How quickly the run generated most of its force.', 'elite'),
    metric('Peak power', shouldShowPower(analysis.diagnostics) ? formatNumber(p?.power?.peakW, 'W') : 'Calibration needed', 'Estimated from force × velocity.', 'elite'),
    metric('Smoothness', score(t?.smoothness), 'Derived from acceleration change / jerk.', 'elite'),
  ];

  return {
    level: 'elite',
    headline: buildHeadline(analysis),
    summary: 'Elite view: physics, scoring and phase quality for detailed self-analysis.',
    metrics,
    insights: [...performanceInsights(analysis), ...diagnosticInsights(analysis)],
    nextActions: analysis.recommendations.map(r => r.message),
    showCharts: { acceleration: true, speed: true, impulse: true, power: true, jerk: true },
    raw: analysis,
  };
}

function createCoachView(analysis: SessionAnalysis): AnalysisView {
  const elite = createEliteView(analysis);
  const diagnostic: DisplayInsight[] = analysis.weaknesses.map(w => ({
    tone: (w.score ?? 100) < 50 ? 'warning' : 'neutral',
    title: w.area,
    body: w.advice.join(' '),
  }));

  return {
    ...elite,
    level: 'coach',
    headline: buildHeadline(analysis),
    summary: 'Coach view: same data as elite view, with emphasis on diagnosis, comparison and prescription.',
    insights: [...performanceInsights(analysis), ...diagnosticInsights(analysis), ...diagnostic],
    nextActions: analysis.weaknesses.flatMap(w => w.advice).slice(0, 8),
    showCharts: { acceleration: true, speed: true, impulse: true, power: true, jerk: true },
  };
}

function metric(label: string, value: string, explanation: string, level: DetailLevel): DisplayMetric {
  return { label, value, explanation, level };
}

// ── Headline builders ─────────────────────────────────────────────────────────
//
// Rules:
//  1. Read the FULL picture — metrics + context + feel + conditions
//  2. One sentence, active voice, no jargon
//  3. Lead with what actually happened, not what could have happened
//  4. Reward persistence and improvement, not just talent
//  5. Never produce a generic fallback that could apply to any session

function buildHeadline(analysis: SessionAnalysis): string {
  const s    = analysis.summary;
  const ctx  = analysis.context;
  const int  = analysis.intelligence;

  const bestReactionS    = s.bestReactionMs != null ? s.bestReactionMs / 1000 : null;
  const consistencyScore = s.consistencyScore ?? null;
  const fatigueTrend     = int?.fatigue?.trend ?? 'unknown';
  const repeatability    = int?.repeatability?.overall ?? null;
  const sessionQuality   = int?.sessionQuality ?? null;

  const focus   = ctx.sessionFocus ?? null;
  const feel    = ctx.rideFeel ?? null;
  const weather = ctx.weatherCondition ?? null;
  const surface = ctx.trackSurface ?? null;

  const hardConditions = ['rain', 'windy', 'cold', 'hot'].includes(weather ?? '')
                      || ['wet', 'damp', 'muddy'].includes(surface ?? '');
  const feelingOff     = feel === 'off';
  const feelingPeak    = feel === 'peak' || feel === 'dialled';
  const goodSession    = sessionQuality != null && sessionQuality >= 65;
  const solidSession   = sessionQuality != null && sessionQuality >= 45;
  const consistent     = consistencyScore != null && consistencyScore <= 5;  // CV%
  const inconsistent   = consistencyScore != null && consistencyScore >= 12;
  const improving      = fatigueTrend === 'improving';
  const declining      = fatigueTrend === 'declining';
  const highRepeat     = repeatability != null && repeatability >= 70;
  const lowRepeat      = repeatability != null && repeatability < 40;

  // Focus-specific headlines — session focus was set, so the rider had intent
  if (focus === 'reaction-time') {
    if (goodSession && consistent)   return 'Reaction focus delivered — quick and repeatable';
    if (goodSession)                 return 'Reaction focus paid off — best times are there';
    if (consistent && !goodSession)  return 'Consistent reactions — work now on bringing the average down';
    if (feelingOff)                  return 'Reaction focus despite an off-day — that is useful data';
    return 'Reaction time session completed — clear picture of where you stand';
  }

  if (focus === 'consistency') {
    if (consistent && highRepeat)    return 'Consistency goal met — runs are locking in well';
    if (consistent)                  return 'Reaction times are tight — good consistency session';
    if (declining)                   return 'Some consistency in early runs — fatigue cost the back end';
    return 'Consistency work in progress — the spread is the thing to watch';
  }

  if (focus === 'explosiveness') {
    const peakG = s.peakG;
    if (peakG != null && peakG >= 2.8 && goodSession) return 'Explosive session — peak G numbers are strong';
    if (peakG != null && peakG >= 2.5)                return 'Good drive through the gate — G-force numbers holding up';
    if (feelingOff && peakG != null && peakG >= 2.3)  return 'Not the best feeling — but the power was still there';
    return 'Explosiveness session logged — G-force data collected for review';
  }

  if (focus === 'technique') {
    const technique = analysis.selectedRun?.technique?.overall ?? null;
    if (technique != null && technique >= 80) return 'Technique session clicked — scores are reflecting the work';
    if (technique != null && technique >= 60) return 'Technique work in progress — clear areas to refine';
    if (feelingOff) return 'Technique under pressure — useful session even on an off-day';
    return 'Technique session completed — analysis shows where to focus next';
  }

  if (focus === 'endurance') {
    if (!declining && consistent)    return 'Held it together across the full set — good endurance run';
    if (declining)                   return 'Performance held early then dropped — that is useful fatigue data';
    return 'Endurance session logged — run-to-run trend is the key number here';
  }

  if (focus === 'recovery') {
    if (goodSession && !declining)   return 'Recovery session — body responded well';
    if (feelingOff && solidSession)  return 'Off day, managed well — smart recovery session';
    return 'Recovery session completed — numbers are secondary today';
  }

  // No focus set — read the dominant story from the data itself

  // Hard conditions + positive outcome
  if (hardConditions) {
    if (goodSession && consistent)   return 'Strong session in tough conditions — consistency held up';
    if (goodSession)                 return 'Good result despite the conditions — that is worth noting';
    if (solidSession && feelingOff)  return 'Conditions were against it — solid effort regardless';
    if (!goodSession && feelingOff)  return 'Tough conditions, off day — but the data is there for next time';
    return 'Challenging conditions managed — useful reference session';
  }

  // Feeling good + strong data
  if (feelingPeak && goodSession && consistent)
    return 'Peak session — feeling matched the numbers today';
  if (feelingPeak && goodSession)
    return 'Strong feeling translated into good numbers';

  // Improving across the session (within-session arc)
  if (improving && consistent && goodSession)
    return 'Session built well — best runs came at the end';
  if (improving && goodSession)
    return 'Warmed into it — performance improved across the set';

  // Declining — fatigue signal
  if (declining && consistent)
    return 'Consistent early, tired late — watch the set length';
  if (declining && lowRepeat)
    return 'Fatigue affected the back end — a shorter set may be more productive';

  // Pure quality reads
  if (goodSession && consistent && highRepeat)
    return 'Solid session — consistent and repeatable across every run';
  if (goodSession && consistent)
    return 'Good session — reaction times are tight and the trend is positive';
  if (goodSession && feelingOff)
    return 'Good numbers on an off-day — that is real progress';
  if (solidSession && inconsistent)
    return 'Some strong runs in there — the gap between best and average is the focus';
  if (inconsistent && lowRepeat)
    return 'Variable session — one or two good runs but consistency is the priority now';
  if (solidSession)
    return 'Decent session — data collected and clear next steps identified';

  // Absolute fallback — at minimum tell them what was analysed
  const runWord = s.runCount === 1 ? 'run' : 'runs';
  return `${s.runCount} ${runWord} analysed — reaction time is your headline number`;
}

function buildSimpleHeadline(analysis: SessionAnalysis): string {
  // Grom view — short, positive, plain English
  const s   = analysis.summary;
  const int = analysis.intelligence;
  const improving = int?.fatigue?.trend === 'improving';
  const consistent = (s.consistencyScore ?? 100) <= 6;

  if (improving && consistent)       return 'Great session — got better every run!';
  if (improving)                     return 'Strong finish — your best runs came at the end';
  if (consistent)                    return 'Super consistent today — nearly the same every time!';
  if (s.bestRunNumber != null)       return `Best start was Run ${s.bestRunNumber} — can you beat it next time?`;
  return 'Session done — nice work today!';
}

function buildRiderHeadline(analysis: SessionAnalysis): string {
  return buildHeadline(analysis);
}

function simpleInsights(analysis: SessionAnalysis): DisplayInsight[] {
  const out: DisplayInsight[] = [];
  if (analysis.summary.consistencyLabel) {
    out.push({ tone: 'positive', title: 'Consistency', body: `Starts were ${analysis.summary.consistencyLabel.toLowerCase()}.` });
  }
  if (analysis.recommendations[0]) {
    out.push({ tone: 'neutral', title: 'Next focus', body: analysis.recommendations[0].message });
  }
  return out;
}

function performanceInsights(analysis: SessionAnalysis): DisplayInsight[] {
  const out: DisplayInsight[] = [];
  const t = analysis.selectedRun?.technique;
  if (t?.phaseAssessment) out.push({ tone: 'neutral', title: 'Technique', body: t.phaseAssessment });
  const jerk = analysis.selectedRun?.physics?.jerk;
  if (jerk?.insight) out.push({ tone: jerk.smoothnessScore < 60 ? 'warning' : 'positive', title: 'Smoothness', body: jerk.insight });
  const impulse = analysis.selectedRun?.physics?.impulse;
  if (impulse) out.push({ tone: 'neutral', title: 'Impulse', body: `90% of impulse was reached at ${impulse.timeToNinetyPctImpulseS}s.` });
  return out;
}

function formatMs(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${Math.round(value)} ms`;
}

function formatNumber(value: number | null | undefined, suffix: string): string {
  return value === null || value === undefined ? '—' : `${value} ${suffix}`;
}

function score(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${Math.round(value)}/100`;
}

function diagnosticInsights(analysis: SessionAnalysis): DisplayInsight[] {
  return analysis.diagnostics
    .filter(d => d.severity !== 'info')
    .slice(0, 4)
    .map(d => ({
      tone: d.severity === 'error' ? 'warning' : 'neutral',
      title: d.area === 'power' ? 'Power calibration' : d.area === 'speed' ? 'Speed calibration' : 'Data check',
      body: d.suggestion ? `${d.message} ${d.suggestion}` : d.message,
    }));
}
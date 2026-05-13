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
    headline: 'Detailed performance breakdown',
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
    headline: 'Coach diagnostic view',
    summary: 'Coach view: same data as elite view, with emphasis on diagnosis, comparison and prescription.',
    insights: [...performanceInsights(analysis), ...diagnosticInsights(analysis), ...diagnostic],
    nextActions: analysis.weaknesses.flatMap(w => w.advice).slice(0, 8),
    showCharts: { acceleration: true, speed: true, impulse: true, power: true, jerk: true },
  };
}

function metric(label: string, value: string, explanation: string, level: DetailLevel): DisplayMetric {
  return { label, value, explanation, level };
}

function buildSimpleHeadline(analysis: SessionAnalysis): string {
  const s = analysis.summary;
  if (s.bestRunNumber) return `Best start was Run ${s.bestRunNumber}`;
  return 'Session analysed';
}

function buildRiderHeadline(analysis: SessionAnalysis): string {
  const t = analysis.selectedRun?.technique?.overall;
  if (t !== null && t !== undefined && t >= 80) return 'Strong session with good technique scores';
  if ((analysis.summary.consistencyScore ?? 100) < 65) return 'Good data collected — consistency is the main opportunity';
  return 'Session analysed with clear next steps';
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

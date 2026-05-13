import type { SessionAnalysis } from './types';
import type { TechniqueScoreBreakdown } from './techniqueScoring';

export type DiagnosticTone = 'positive' | 'neutral' | 'warning';

export interface CoachDiagnostic {
  title: string;
  tone: DiagnosticTone;
  summary: string;
  evidence: string[];
  prescription: string[];
  audience: 'grom' | 'rider' | 'elite' | 'coach';
}

export function buildCoachDiagnostics(analysis: SessionAnalysis, scores: TechniqueScoreBreakdown): CoachDiagnostic[] {
  const out: CoachDiagnostic[] = [];
  const p = analysis.selectedRun?.physics;

  if ((scores.launchQuality ?? 0) >= 80 && (scores.explosiveness ?? 0) < 60) {
    out.push({
      title: 'Reaction is ahead of drive force',
      tone: 'warning',
      summary: 'The rider is reacting well, but the first drive phase is not producing enough acceleration.',
      evidence: [`Launch quality ${fmt(scores.launchQuality)}`, `Explosiveness ${fmt(scores.explosiveness)}`],
      prescription: ['Keep gate reaction work ticking over.', 'Add first-pedal force drills.', 'Measure whether peak G improves without reaction time getting worse.'],
      audience: 'coach',
    });
  }

  if ((scores.explosiveness ?? 0) >= 75 && (scores.speedCarry ?? 100) < 60) {
    out.push({
      title: 'Explosive start but poor speed carry',
      tone: 'warning',
      summary: 'The run creates force early, but speed is not being carried through the later part of the effort.',
      evidence: [`Explosiveness ${fmt(scores.explosiveness)}`, `Speed carry ${fmt(scores.speedCarry)}`],
      prescription: ['Work on drive-phase continuation after the first hit.', 'Use resisted starts followed by clean free-roll starts.', 'Compare speed at the end of each run, not just peak speed.'],
      audience: 'elite',
    });
  }

  if ((scores.smoothness ?? 100) < 60) {
    out.push({
      title: 'Force application is choppy',
      tone: 'warning',
      summary: 'The acceleration trace changes sharply, suggesting inconsistent force delivery or noisy sensor mounting.',
      evidence: [`Smoothness ${fmt(scores.smoothness)}`, p?.jerk?.insight ?? 'Jerk profile needs review'],
      prescription: ['Check device mounting first.', 'Coach smoother first three pedal strokes.', 'Use the jerk chart to spot spikes that are technique rather than noise.'],
      audience: 'coach',
    });
  }

  if ((scores.repeatability ?? 100) < 65) {
    out.push({
      title: 'Repeatability is the main limiter',
      tone: 'warning',
      summary: 'The best effort may be useful, but the spread across runs suggests the rider cannot reproduce it consistently yet.',
      evidence: [`Repeatability ${fmt(scores.repeatability)}`, `Consistency ${analysis.summary.consistencyLabel ?? 'unknown'}`],
      prescription: ['Use smaller sets and stop before quality drops.', 'Track best vs average, not only personal best.', 'Add a consistency target to goals.'],
      audience: 'rider',
    });
  }

  if ((scores.impulseTiming ?? 0) >= 80 && p?.impulse) {
    out.push({
      title: 'Impulse timing is strong',
      tone: 'positive',
      summary: 'Most of the estimated force is being produced early enough to support a strong launch.',
      evidence: [`90% impulse at ${p.impulse.timeToNinetyPctImpulseS}s`, `Impulse timing ${fmt(scores.impulseTiming)}`],
      prescription: ['Protect this quality while improving carry.', 'Avoid adding volume that makes the first phase slower.'],
      audience: 'elite',
    });
  }

  if (!out.length) {
    out.push({
      title: 'Balanced run profile',
      tone: 'neutral',
      summary: 'No single limiter dominates this run. Use the charts to decide whether to chase reaction, force, or consistency next.',
      evidence: [`Overall technique ${fmt(scores.overall)}`],
      prescription: ['Pick one target metric for the next block.', 'Re-test with the same setup to make comparisons fair.'],
      audience: 'rider',
    });
  }

  return out;
}

function fmt(value: number | null | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)}/100` : 'unknown';
}

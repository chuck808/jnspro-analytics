import type { Recommendation, SessionAnalysis, WeaknessAnalysis } from './types';

export function identifyWeaknesses(analysis: Pick<SessionAnalysis, 'summary' | 'selectedRun'>): WeaknessAnalysis[] {
  const weaknesses: WeaknessAnalysis[] = [];
  const t = analysis.selectedRun?.technique;

  if (analysis.summary.bestReactionMs !== null && analysis.summary.bestReactionMs > 350) {
    weaknesses.push({
      area: 'Reaction Time',
      score: t?.reaction ?? null,
      advice: [
        'Build a consistent pre-gate routine.',
        'Use random gate timing so the rider reacts rather than guesses.',
        'Keep the first movement relaxed and sharp rather than tense.',
      ],
    });
  }

  if ((t?.explosiveness ?? 100) < 70) {
    weaknesses.push({
      area: 'Explosiveness',
      score: t?.explosiveness ?? null,
      advice: [
        'Focus on the first three pedal strokes.',
        'Use short maximal gate efforts with full recovery.',
        'Check body position: weight forward, hips loaded, first pedal committed.',
      ],
    });
  }

  if ((t?.smoothness ?? 100) < 65) {
    weaknesses.push({
      area: 'Smoothness',
      score: t?.smoothness ?? null,
      advice: [
        'Work on applying force progressively after the snap out of the gate.',
        'Compare the acceleration curve of the best and worst runs.',
        'Avoid over-pulling or bouncing through the first pedal strokes.',
      ],
    });
  }

  if ((analysis.summary.consistencyScore ?? 100) < 65) {
    weaknesses.push({
      area: 'Repeatability',
      score: analysis.summary.consistencyScore,
      advice: [
        'Prioritise repeatable starts over one-off best efforts.',
        'Run smaller sets and stop when quality drops.',
        'Track spread between best and average reaction times.',
      ],
    });
  }

  return weaknesses;
}

export function generateRecommendations(analysis: Pick<SessionAnalysis, 'summary' | 'selectedRun' | 'profileComplete'>, weaknesses: WeaknessAnalysis[]): Recommendation[] {
  const recs: Recommendation[] = [];

  if (!analysis.profileComplete) {
    recs.push({
      priority: 'medium',
      title: 'Complete rider and bike profile',
      message: 'Add rider weight and bike weight so power and impulse estimates become available.',
      metric: 'profile',
    });
  }

  for (const weakness of weaknesses.slice(0, 3)) {
    recs.push({
      priority: weakness.score !== null && weakness.score !== undefined && weakness.score < 50 ? 'high' : 'medium',
      title: `Improve ${weakness.area}`,
      message: weakness.advice[0] ?? 'Focus this area in the next training block.',
      metric: weakness.area,
    });
  }

  const impulse = analysis.selectedRun?.physics?.impulse;
  if (impulse && impulse.timeToHalfImpulseS > 0.8) {
    recs.push({
      priority: 'medium',
      title: 'Front-load the launch force',
      message: 'You are taking a little long to generate half of total impulse; target sharper first-pedal force.',
      metric: 'impulse',
    });
  }

  if (!recs.length) {
    recs.push({
      priority: 'low',
      title: 'Maintain quality',
      message: 'Session looks solid. Keep collecting repeat sessions so trends become meaningful.',
    });
  }

  return recs;
}

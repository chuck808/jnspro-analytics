import type { Recommendation, SessionAnalysis, WeaknessAnalysis, RiderContext } from './types';

const isTesting = (rider: RiderContext) =>
  rider.sessionFocus === 'testing' || rider.sessionFocus === 'technique';

export function identifyWeaknesses(
  analysis: Pick<SessionAnalysis, 'summary' | 'selectedRun'>,
  rider: RiderContext = {}
): WeaknessAnalysis[] {
  const weaknesses: WeaknessAnalysis[] = [];
  const t = analysis.selectedRun?.technique;
  const testing = isTesting(rider);

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
    // On a testing or technique session, variability is expected and intentional.
    // Flag it but reframe the advice so the rider isn't told to fix something
    // they were deliberately doing.
    const advice = testing
      ? [
          'Consistency is lower — expected when testing new technique or setup.',
          'Once the change feels stable, run a standard session to measure the real baseline.',
          'Compare this session against a pre-change baseline to judge whether the change helped.',
        ]
      : [
          'Prioritise repeatable starts over one-off best efforts.',
          'Run smaller sets and stop when quality drops.',
          'Track spread between best and average reaction times.',
        ];

    weaknesses.push({
      area: 'Repeatability',
      score: analysis.summary.consistencyScore,
      advice,
    });
  }

  return weaknesses;
}

export function generateRecommendations(
  analysis: Pick<SessionAnalysis, 'summary' | 'selectedRun' | 'profileComplete'>,
  weaknesses: WeaknessAnalysis[],
  rider: RiderContext = {}
): Recommendation[] {
  const recs: Recommendation[] = [];
  const testing = isTesting(rider);

  // Testing/technique sessions: lead with a context note so the rider
  // understands the frame before seeing any weaknesses.
  if (testing) {
    recs.push({
      priority: 'low',
      title: 'Testing session — interpret with context',
      message: `This session was logged as ${rider.sessionFocus}. Variability is expected when trying something new. Focus on whether the change felt better, not on raw consistency numbers.`,
      metric: 'session_focus',
    });
  }

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
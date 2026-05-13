import { applyCrossSessionTruthRules } from '../src/lib/performance-engine/crossSession/truthRules';

const report: any = {
  status: 'ready',
  confidence: 'low',
  overallTrend: 'stable',
  headline: 'Performance stable across sessions',
  warnings: ['Speed improving but set capacity dropping'],
  recommendations: ['Excellent progress - maintain current approach'],
  performance: {
    speedTrend: { direction: 'improving' },
    reactionTrend: { direction: 'stable' }
  },
  consistency: {
    repeatabilityTrend: { direction: 'stable' },
    bestVsAverageGapTrend: { direction: 'stable' }
  },
  fatigue: {
    optimalSetLengthTrend: { direction: 'declining' },
    dropOffTrend: { direction: 'stable' }
  }
};

const truth = applyCrossSessionTruthRules(report);

console.log(truth.headline);
// Mixed performance — speed improving but capacity dropping

console.log(truth.recommendations);
// [
//   'Address the capacity drop before increasing intensity.',
//   'Reduce set length or increase recovery until quality remains stable.'
// ]

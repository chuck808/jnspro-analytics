import { buildSessionNarrative } from '../src/lib/performance-engine/sessionNarrative';
import { renderCoachingMessage } from '../src/lib/performance-engine/language';

const narrative = buildSessionNarrative({
  runCount: 5,
  consistencyScore: 15,
  reactionCvPercent: 8.5,
  smoothnessScore: 97,
  dataQualityRating: 'fair',
  speedBlocked: true,
  powerBlocked: true,
  hasCalibrationWarnings: true,
  warnings: [
    'Estimated peak speed is above the normal BMX sanity range.',
    'Estimated peak power is outside a useful coaching range.'
  ]
});

console.log(narrative.message.headline);
console.log(renderCoachingMessage(narrative.message, narrative.trust));

import type { BMXThresholdProfile } from './types';

const starterConfidence = 'starter' as const;

export const BMX_THRESHOLD_PROFILES: Record<string, BMXThresholdProfile> = {
	grom: {
		profileName: 'Grom / Parent',
		level: 'grom',
		metrics: {
			reactionTimeMs: {
				excellent: 300,
				good: 400,
				caution: 550,
				poor: 700,
				unit: 'ms',
				direction: 'lower-is-better',
				confidence: starterConfidence,
				notes:
					'Starter thresholds only. Keep grom feedback encouraging and avoid over-focusing on reaction time.'
			},
			peakSpeedKmh: {
				excellent: 35,
				good: 28,
				caution: 22,
				poor: 16,
				unit: 'km/h',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Very age, gearing, hill and rider-size dependent.'
			},
			peakG: {
				excellent: 2.0,
				good: 1.5,
				caution: 1.0,
				poor: 0.6,
				unit: 'g',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Use only after acceleration calibration is confirmed.'
			},
			repeatabilityScore: {
				excellent: 85,
				good: 70,
				caution: 55,
				poor: 40,
				unit: '/100',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Repeatability matters more than peak output for development riders.'
			},
			bestVsAvgGapPercent: {
				excellent: 4,
				good: 8,
				caution: 12,
				poor: 18,
				unit: '%',
				direction: 'lower-is-better',
				confidence: starterConfidence,
				notes: 'Lower gap means the rider can repeat good runs.'
			},
			optimalSetLength: {
				excellent: 5,
				good: 4,
				caution: 3,
				poor: 2,
				unit: 'runs',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Use for session planning, not athlete judgement.'
			},
			dropOffRun: {
				excellent: 6,
				good: 5,
				caution: 4,
				poor: 3,
				unit: 'run',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Later drop-off generally means better quality endurance.'
			},
			smoothnessScore: {
				excellent: 85,
				good: 70,
				caution: 55,
				poor: 40,
				unit: '/100',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Jerk-derived score; sensitive to sensor noise.'
			}
		}
	},

	rider: {
		profileName: 'Club Rider',
		level: 'rider',
		metrics: {
			reactionTimeMs: {
				excellent: 220,
				good: 300,
				caution: 420,
				poor: 550,
				unit: 'ms',
				direction: 'lower-is-better',
				confidence: starterConfidence,
				notes: 'Starter BMX gate reaction thresholds. Tune with real rider/device data.'
			},
			peakSpeedKmh: {
				excellent: 45,
				good: 38,
				caution: 32,
				poor: 25,
				unit: 'km/h',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Highly dependent on start hill, gate setup, rollout distance and gearing.'
			},
			peakG: {
				excellent: 2.8,
				good: 2.2,
				caution: 1.6,
				poor: 1.0,
				unit: 'g',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Only trust once accelerometer scaling and mounting are stable.'
			},
			repeatabilityScore: {
				excellent: 88,
				good: 75,
				caution: 60,
				poor: 45,
				unit: '/100',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Good club riders should build repeatable starts before chasing peaks.'
			},
			bestVsAvgGapPercent: {
				excellent: 3.5,
				good: 7,
				caution: 10,
				poor: 15,
				unit: '%',
				direction: 'lower-is-better',
				confidence: starterConfidence,
				notes: 'A widening gap can suggest peak chasing or inconsistent execution.'
			},
			optimalSetLength: {
				excellent: 6,
				good: 5,
				caution: 4,
				poor: 3,
				unit: 'runs',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Useful for deciding quality set size.'
			},
			dropOffRun: {
				excellent: 7,
				good: 6,
				caution: 5,
				poor: 4,
				unit: 'run',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Earlier drop-off may indicate fatigue, poor recovery, or too many runs.'
			},
			smoothnessScore: {
				excellent: 88,
				good: 75,
				caution: 60,
				poor: 45,
				unit: '/100',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Use as a coaching cue, not a standalone judgement.'
			}
		}
	},

	elite: {
		profileName: 'Elite Athlete',
		level: 'elite',
		metrics: {
			reactionTimeMs: {
				excellent: 160,
				good: 220,
				caution: 300,
				poor: 400,
				unit: 'ms',
				direction: 'lower-is-better',
				confidence: starterConfidence,
				notes:
					'Starter elite thresholds. Real competition timing systems may differ from device detection.'
			},
			peakSpeedKmh: {
				excellent: 58,
				good: 50,
				caution: 43,
				poor: 35,
				unit: 'km/h',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Treat as device/session-specific until validated against known track distances.'
			},
			peakG: {
				excellent: 3.8,
				good: 3.0,
				caution: 2.2,
				poor: 1.5,
				unit: 'g',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Very sensitive to mounting and filtering.'
			},
			repeatabilityScore: {
				excellent: 92,
				good: 82,
				caution: 68,
				poor: 55,
				unit: '/100',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Elite riders need peak output and repeatability.'
			},
			bestVsAvgGapPercent: {
				excellent: 2.5,
				good: 5,
				caution: 8,
				poor: 12,
				unit: '%',
				direction: 'lower-is-better',
				confidence: starterConfidence,
				notes: 'Small gaps indicate reliable race-quality outputs.'
			},
			optimalSetLength: {
				excellent: 8,
				good: 6,
				caution: 5,
				poor: 4,
				unit: 'runs',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Depends heavily on the training objective.'
			},
			dropOffRun: {
				excellent: 8,
				good: 7,
				caution: 5,
				poor: 4,
				unit: 'run',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Do not force longer sets if the session goal is pure quality.'
			},
			smoothnessScore: {
				excellent: 92,
				good: 82,
				caution: 68,
				poor: 55,
				unit: '/100',
				direction: 'higher-is-better',
				confidence: starterConfidence,
				notes: 'Smoothness should be interpreted alongside speed and impulse.'
			}
		}
	}
};

export function getThresholdProfile(
	level: 'grom' | 'rider' | 'elite' | 'coach' = 'rider'
): BMXThresholdProfile {
	if (level === 'coach') return BMX_THRESHOLD_PROFILES.elite;
	return BMX_THRESHOLD_PROFILES[level] ?? BMX_THRESHOLD_PROFILES.rider;
}

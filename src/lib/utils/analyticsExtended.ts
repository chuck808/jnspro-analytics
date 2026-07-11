/**
 * BMX Analytics Computation Library — Extended
 *
 * @deprecated LEGACY SYSTEM - Use Performance Engine instead
 *
 * This module has been superseded by the Performance Engine.
 * All functions have been migrated to:
 *   - performance-engine/sessionAnalysis.ts (computeSessionStability)
 *   - performance-engine/recommendations.ts (weakness & recommendation generation)
 *   - Performance Engine handles all analytics in unified output
 *
 * Migration completed: May 1, 2026 (Phases 1-3)
 *
 * STATUS: Preserved for reference only - DO NOT USE in new code
 *
 * Migration guide:
 *   OLD: import { computeSessionStability } from '$lib/utils/analyticsExtended'
 *   NEW: import { computeSessionStability } from '$lib/performance-engine'
 *        OR use: analyseSession() which includes all analytics
 *
 * See: PHASE_1_LEGACY_MIGRATION_COMPLETE.md for full migration details
 *
 * ---
 *
 * Original documentation:
 * Additions over base analytics.ts:
 *   - Jerk computation and analysis (rate of change of acceleration)
 *   - Detailed phase detection (Drive / Transition / Velocity) using threshold + jerk sign
 *   - G-Force stability (first 0.5s average)
 *   - Weakness identification from scored metrics
 *   - Recommendations engine (metric thresholds → prioritised advice)
 *   - Circular gauge score helper
 */

const GRAVITY = 9.80665;

// ─── Re-export base functions (unchanged) ─────────────────────────────────────
export {
	computeSpeedCurve,
	calculateSpeedSplits,
	assessDataQuality,
	classifySpeedProfile,
	scoreTechnique,
	estimatePower,
	scoreConsistency,
	analyseImpulse
} from './analytics';

export type {
	SpeedCurve,
	SpeedSplit,
	DataQuality,
	TechniqueScores,
	PowerMetrics,
	ConsistencyResult,
	ImpulseResult
} from './analytics';

// ─── Jerk ────────────────────────────────────────────────────────────────────

export interface JerkPoint {
	timeS: number;
	jerk: number; // m/s³
}

export interface JerkProfile {
	data: JerkPoint[];
	peakPositive: number;
	peakNegative: number;
	meanAbsolute: number;
	smoothnessScore: number; // 0–100, higher = smoother
	initialJerkPositive: boolean;
	insight: string;
}

export function computeJerk(chartData: number[], elapsedMs: number): JerkProfile {
	if (chartData.length < 3) {
		return {
			data: [],
			peakPositive: 0,
			peakNegative: 0,
			meanAbsolute: 0,
			smoothnessScore: 0,
			initialJerkPositive: true,
			insight: 'Insufficient data'
		};
	}

	const smooth = (data: number[], w = 5) =>
		data.map((_, i) => {
			const s = Math.max(0, i - Math.floor(w / 2));
			const e = Math.min(data.length, i + Math.floor(w / 2) + 1);
			return data.slice(s, e).reduce((a, b) => a + b, 0) / (e - s);
		});

	const dt = elapsedMs / 1000 / chartData.length;
	const accelMs2 = smooth(chartData.map((g) => g * GRAVITY));

	const data: JerkPoint[] = [];
	for (let i = 1; i < accelMs2.length; i++) {
		const da = accelMs2[i] - accelMs2[i - 1];
		data.push({ timeS: i * dt, jerk: da / dt });
	}

	const jerks = data.map((d) => d.jerk).filter((j) => isFinite(j));
	const absJerks = jerks.map(Math.abs);
	const peakPos = Math.max(...jerks);
	const peakNeg = Math.min(...jerks);
	const meanAbs = absJerks.reduce((a, b) => a + b, 0) / absJerks.length;
	const peakAccel = Math.max(...accelMs2);

	const smoothnessScore = Math.max(
		0,
		Math.min(100, 100 - (meanAbs / (peakAccel * 0.5 || 1)) * 100)
	);

	const initialAvg =
		jerks.slice(0, Math.max(1, Math.floor(jerks.length * 0.1))).reduce((a, b) => a + b, 0) /
		Math.max(1, Math.floor(jerks.length * 0.1));

	const insight =
		initialAvg > 0
			? 'Explosive start — rapid initial force application'
			: 'Gradual power development — smoother initial stroke';

	return {
		data,
		peakPositive: peakPos,
		peakNegative: peakNeg,
		meanAbsolute: meanAbs,
		smoothnessScore,
		initialJerkPositive: initialAvg > 0,
		insight
	};
}

// ─── Detailed Phase Detection ─────────────────────────────────────────────────

export interface PhaseMetrics {
	drivePhase: {
		durationS: number;
		peakAccelMs2: number;
		timeToPeakS: number;
		efficiency: number;
	};
	transitionPhase: {
		durationS: number;
		velocityAtEndMs: number;
		transitionEfficiency: number;
	};
	velocityPhase: {
		durationS: number;
		peakVelocityMs: number;
		timeToMaxS: number;
		maintenanceScore: number;
	};
	technicalAssessment: string;
}

export function computeDetailedPhases(chartData: number[], elapsedMs: number): PhaseMetrics | null {
	if (chartData.length < 10) return null;

	const dt = elapsedMs / 1000 / chartData.length;
	const smooth = (data: number[], w = 5) =>
		data.map((_, i) => {
			const s = Math.max(0, i - Math.floor(w / 2));
			const e = Math.min(data.length, i + Math.floor(w / 2) + 1);
			return data.slice(s, e).reduce((a, b) => a + b, 0) / (e - s);
		});

	const accelMs2 = smooth(chartData.map((g) => g * GRAVITY));
	const peakAccel = Math.max(...accelMs2);
	const peakIdx = accelMs2.indexOf(peakAccel);

	let driveEnd = peakIdx;
	for (let i = peakIdx; i < accelMs2.length; i++) {
		if (accelMs2[i] < peakAccel * 0.3) {
			driveEnd = i;
			break;
		}
	}

	const jerk = accelMs2.slice(1).map((a, i) => a - accelMs2[i]);
	for (let i = peakIdx; i < Math.min(jerk.length, driveEnd + 20); i++) {
		if (jerk[i] < -peakAccel * 0.5) {
			driveEnd = i;
			break;
		}
	}

	let vel = 0;
	const velocities: number[] = [];
	for (const a of accelMs2) {
		vel += a * dt;
		velocities.push(vel);
	}

	const peakVel = Math.max(...velocities);
	const peakVelIdx = velocities.indexOf(peakVel);

	const velGrad = velocities.slice(1).map((v, i) => v - velocities[i]);
	let inflection = driveEnd;
	for (let i = driveEnd + 1; i < velGrad.length - 1; i++) {
		if (velGrad[i] < velGrad[i - 1] * 0.8) {
			inflection = i;
			break;
		}
	}

	const driveEff =
		driveEnd > 0 && peakAccel > 0 ? velocities[driveEnd] / (driveEnd * dt * peakAccel) : 0;

	const transJerks = jerk.slice(driveEnd, inflection).map(Math.abs);
	const transEff =
		transJerks.length > 0 && Math.abs(jerk[driveEnd] || 1) > 0
			? Math.max(
					0,
					1 - transJerks.reduce((a, b) => a + b, 0) / transJerks.length / Math.abs(jerk[driveEnd])
				)
			: 0.5;

	const velPhaseVels = velocities.slice(inflection);
	const velMaint =
		velPhaseVels.length > 0 && peakVel > 0
			? velPhaseVels.reduce((a, b) => a + b, 0) / (velPhaseVels.length * peakVel)
			: 0;

	let technicalAssessment: string;
	if (driveEff > 0.8 && transEff > 0.7 && velMaint > 0.9)
		technicalAssessment = 'Elite technical performance — optimal phase transitions throughout';
	else if (driveEff > 0.7 && transEff > 0.6 && velMaint > 0.8)
		technicalAssessment = 'Strong technical performance with good phase management';
	else if (driveEff > 0.8 && (transEff < 0.6 || velMaint < 0.8))
		technicalAssessment =
			'Explosive drive phase — focus on smoother transition and velocity maintenance';
	else if (driveEff < 0.7 && transEff > 0.7 && velMaint > 0.8)
		technicalAssessment = 'Good velocity profile — initial drive power needs improvement';
	else
		technicalAssessment =
			'Technical improvements available across all phases — consistent practice will close the gaps';

	return {
		drivePhase: {
			durationS: parseFloat((driveEnd * dt).toFixed(3)),
			peakAccelMs2: parseFloat(peakAccel.toFixed(3)),
			timeToPeakS: parseFloat((peakIdx * dt).toFixed(3)),
			efficiency: parseFloat(Math.min(1, driveEff).toFixed(3))
		},
		transitionPhase: {
			durationS: parseFloat(((inflection - driveEnd) * dt).toFixed(3)),
			velocityAtEndMs: parseFloat((velocities[inflection] ?? 0).toFixed(3)),
			transitionEfficiency: parseFloat(Math.min(1, transEff).toFixed(3))
		},
		velocityPhase: {
			durationS: parseFloat(((peakVelIdx - inflection) * dt).toFixed(3)),
			peakVelocityMs: parseFloat(peakVel.toFixed(3)),
			timeToMaxS: parseFloat((peakVelIdx * dt).toFixed(3)),
			maintenanceScore: parseFloat(Math.min(1, velMaint).toFixed(3))
		},
		technicalAssessment
	};
}

// ─── G-Force Stability ────────────────────────────────────────────────────────

export function computeGForceStability(chartData: number[], elapsedMs: number): number | null {
	if (!chartData.length || !elapsedMs) return null;
	const samplesPerSecond = chartData.length / (elapsedMs / 1000);
	const window = Math.max(1, Math.round(0.5 * samplesPerSecond));
	const slice = chartData.slice(0, window);
	return slice.reduce((a, b) => a + Math.abs(b), 0) / slice.length;
}

// ─── Weakness Identification ──────────────────────────────────────────────────

export interface Weakness {
	area: string;
	score: number;
	threshold: number;
	advice: string[];
}

/**
 * Enhanced weakness identification with Performance Engine integration
 * Uses rider-level adaptive thresholds instead of hardcoded values
 */
export function identifyWeaknesses(
	reactionMs: number,
	techniqueScores: {
		reaction: number;
		explosiveness: number;
		smoothness: number;
		efficiency: number;
	},
	phaseMetrics: PhaseMetrics | null,
	jerkProfile: JerkProfile | null,
	riderLevel: string | null,
	performanceEngineData?: {
		techniqueAnalysis?: {
			reaction?: number | null;
			explosiveness?: number | null;
			smoothness?: number | null;
			efficiency?: number | null;
		} | null;
		weaknesses?: Array<{ area: string; score?: number | null; advice: string[] }>;
		physics?: { jerk?: { smoothnessScore: number } | null } | null;
	}
): Weakness[] {
	const weaknesses: Weakness[] = [];

	// Use rider-level adaptive thresholds (imported from Performance Engine patterns)
	const THRESHOLDS = getRiderLevelThresholds(riderLevel);
	const TECHNIQUE_THRESHOLD = THRESHOLDS.techniqueScore;
	const PHASE_EFFICIENCY_THRESHOLD = THRESHOLDS.phaseEfficiency;
	const SMOOTHNESS_THRESHOLD = THRESHOLDS.smoothness;

	// ── Reaction ──────────────────────────────────────────────────────────────
	// Prefer Performance Engine technique analysis if available
	const reactionScore =
		performanceEngineData?.techniqueAnalysis?.reaction ?? techniqueScores.reaction;
	const reactionThreshold = THRESHOLDS.reaction;

	if (reactionScore < reactionThreshold) {
		const severe = reactionScore < reactionThreshold * 0.6; // 60% of threshold
		weaknesses.push({
			area: 'Reaction Time',
			score: reactionScore,
			threshold: reactionThreshold,
			advice: severe
				? [
						`Reaction score of ${Math.round(reactionScore)}/100 needs focused work — this is significantly below target for ${riderLevel ?? 'your'} level`,
						'Build a consistent pre-gate routine: same breathing, same focus point every run',
						'Use AppGatePro random start mode daily — even 10 minutes builds the neural pathway',
						'Body position in the gate matters — lean forward, weight on the pedal, not the seat',
						'Consider if tension is slowing you down — a relaxed rider reacts faster than a tense one'
					]
				: [
						'Reaction time is close to target — small adjustments can find the remaining margin',
						'Fine-tune your gate position — a few mm forward can save 15–20ms',
						'Mental preparation routine: same trigger phrase or focus point before each start',
						'Track which runs feel different when reaction is better — replicate those conditions'
					]
		});
	}

	// ── Explosiveness ─────────────────────────────────────────────────────────
	const explosivenessScore =
		performanceEngineData?.techniqueAnalysis?.explosiveness ?? techniqueScores.explosiveness;
	const explosivenessThreshold = THRESHOLDS.explosiveness;

	if (explosivenessScore < explosivenessThreshold) {
		const severe = explosivenessScore < explosivenessThreshold * 0.6;
		weaknesses.push({
			area: 'Explosive Power',
			score: explosivenessScore,
			threshold: explosivenessThreshold,
			advice: severe
				? [
						`Explosiveness score of ${Math.round(explosivenessScore)}/100 — first stroke power needs significant work`,
						'First pedal technique: the power must come in the first 30% of the crank rotation',
						'Explosive gym work — jump squats, power cleans, box jumps build the fast-twitch response',
						'Practice maximum effort gate starts every session — not volume, pure quality',
						"Check your starting gear — if you're spinning out, gear up; if grinding, gear down"
					]
				: [
						"Explosiveness is developing — there's meaningful power to find here",
						'Focus on front-loading force in the first stroke rather than building gradually',
						'Hip extension timing: drive through the pedal and extend the hip simultaneously',
						"Review the G-force chart — peak should come early; if it's mid-run, that's the issue"
					]
		});
	}

	// ── Smoothness ────────────────────────────────────────────────────────────
	// Prefer Performance Engine jerk smoothness if available
	const peSmoothnessScore = performanceEngineData?.physics?.jerk?.smoothnessScore;
	const smoothnessScore =
		peSmoothnessScore ??
		performanceEngineData?.techniqueAnalysis?.smoothness ??
		techniqueScores.smoothness;

	if (smoothnessScore < SMOOTHNESS_THRESHOLD) {
		const severe = smoothnessScore < SMOOTHNESS_THRESHOLD * 0.6;
		weaknesses.push({
			area: 'Force Application Smoothness',
			score: smoothnessScore,
			threshold: SMOOTHNESS_THRESHOLD,
			advice: severe
				? [
						`Smoothness score of ${Math.round(smoothnessScore)}/100 — erratic force application is losing speed`,
						'Practice at 60–70% effort focusing purely on fluid, continuous stroke mechanics',
						'The jerk chart shows exactly where technique breaks down — review those spikes',
						'Core stability training: a stable torso is the platform for smooth power transfer',
						'Pedalling in circles not squares: think of the full stroke, not just the down stroke'
					]
				: [
						'Force application has some roughness — a smoother delivery will improve efficiency',
						'Focus on the transition between strokes — where the jerk peaks is usually the problem',
						'Slow-motion practice at 50% effort helps wire the smooth movement pattern',
						'Check if fatigue late in a session causes smoothness to drop'
					]
		});
	}

	// ── Drive phase efficiency ────────────────────────────────────────────────
	if (phaseMetrics && phaseMetrics.drivePhase.efficiency * 100 < PHASE_EFFICIENCY_THRESHOLD) {
		const effScore = Math.round(phaseMetrics.drivePhase.efficiency * 100);
		const effThreshold = PHASE_EFFICIENCY_THRESHOLD;
		weaknesses.push({
			area: 'Drive Phase Efficiency',
			score: effScore,
			threshold: effThreshold,
			advice:
				effScore < effThreshold * 0.7
					? [
							`Drive phase efficiency of ${effScore}% — acceleration is not converting into speed effectively`,
							'Body position during the drive is likely the primary cause — stay low and forward',
							'Ensure full crank extension through the power stroke — partial strokes waste force',
							'Saddle height and fore/aft position directly affect power transfer — get a bike fit check',
							"Watch if you're moving backwards under force — that energy is not going to the bike"
						]
					: [
							'Drive phase efficiency has room to improve — power is being partially lost in the stroke',
							'Focus on body position in the drive phase — forward weight placement helps',
							'Review crank extension — are you getting full hip extension through the stroke?'
						]
		});
	}

	// ── Velocity maintenance ──────────────────────────────────────────────────
	const velocityThreshold = THRESHOLDS.velocityMaintenance;
	if (phaseMetrics && phaseMetrics.velocityPhase.maintenanceScore * 100 < velocityThreshold) {
		const maintScore = Math.round(phaseMetrics.velocityPhase.maintenanceScore * 100);
		weaknesses.push({
			area: 'Velocity Maintenance',
			score: maintScore,
			threshold: velocityThreshold,
			advice:
				maintScore < velocityThreshold * 0.75
					? [
							`Speed dropping significantly after peak — momentum is being lost earlier than expected`,
							'Over-pedalling disrupts rhythm after the drive phase — find the cadence not the grind',
							'Check if fatigue is causing the drop — this often worsens later in a session',
							'Sprint training: building the ability to sustain high cadence past the gate start',
							'Transition into your sprint position smoothly — disruption here kills speed'
						]
					: [
							'Speed tails off slightly after peak — small improvement available here',
							'Maintain cadence through the transition out of the gate',
							'Cadence drills at high RPM help the body maintain speed after the drive'
						]
		});
	}

	// ── Jerk smoothness fallback ──────────────────────────────────────────────
	const jerkThreshold = THRESHOLDS.jerkSmoothnessMinimum;
	if (jerkProfile && jerkProfile.smoothnessScore < jerkThreshold) {
		if (!weaknesses.find((w) => w.area === 'Force Application Smoothness')) {
			weaknesses.push({
				area: 'Power Application Consistency',
				score: Math.round(jerkProfile.smoothnessScore),
				threshold: jerkThreshold,
				advice: [
					'High jerk values indicate erratic force application through the start',
					'Practice smooth gate starts at 70% effort to build the movement pattern first',
					'Film your starts — visual feedback helps identify where rhythm breaks',
					'Breathing rhythm during the start affects smoothness significantly',
					'Core stability work: a stable base produces more consistent power delivery'
				]
			});
		}
	}

	// Integrate Performance Engine weaknesses if provided
	if (performanceEngineData?.weaknesses) {
		for (const peWeakness of performanceEngineData.weaknesses) {
			// Only add if not already covered by legacy analysis
			const alreadyCovered = weaknesses.some(
				(w) =>
					w.area.toLowerCase().includes(peWeakness.area.toLowerCase()) ||
					peWeakness.area.toLowerCase().includes(w.area.toLowerCase())
			);
			if (!alreadyCovered && peWeakness.score !== null && peWeakness.score !== undefined) {
				weaknesses.push({
					area: peWeakness.area,
					score: peWeakness.score,
					threshold: TECHNIQUE_THRESHOLD,
					advice: peWeakness.advice
				});
			}
		}
	}

	return weaknesses.sort((a, b) => a.score - b.score);
}

/**
 * Get rider-level adaptive thresholds
 * Maps to Performance Engine threshold system
 */
function getRiderLevelThresholds(riderLevel: string | null) {
	const level = riderLevel?.toLowerCase() ?? 'rider';

	// Thresholds adapted from Performance Engine profiles
	if (level.includes('grom') || level.includes('parent')) {
		return {
			techniqueScore: 65,
			reaction: 65,
			explosiveness: 65,
			smoothness: 70,
			phaseEfficiency: 65,
			velocityMaintenance: 75,
			jerkSmoothnessMinimum: 55
		};
	} else if (level.includes('elite') || level.includes('coach')) {
		return {
			techniqueScore: 75,
			reaction: 75,
			explosiveness: 75,
			smoothness: 80,
			phaseEfficiency: 75,
			velocityMaintenance: 85,
			jerkSmoothnessMinimum: 65
		};
	} else {
		// Rider / Club level (default)
		return {
			techniqueScore: 70,
			reaction: 70,
			explosiveness: 70,
			smoothness: 75,
			phaseEfficiency: 70,
			velocityMaintenance: 80,
			jerkSmoothnessMinimum: 60
		};
	}
}

// ─── Recommendations Engine ───────────────────────────────────────────────────

export interface Recommendation {
	priority: 'high' | 'medium' | 'low';
	category: 'reaction' | 'power' | 'technique' | 'consistency' | 'equipment';
	title: string;
	insight: string;
	advice: string[];
}

/**
 * Get rider-level adaptive recommendation thresholds
 * Integrates with Performance Engine threshold system
 */
function getRecommendationThresholds(riderLevel: string | null) {
	const level = riderLevel?.toLowerCase() ?? 'rider';

	// Thresholds adapted from Performance Engine profiles (thresholds/profiles.ts)
	if (level.includes('grom') || level.includes('parent')) {
		return {
			reactionMs: { excellent: 300, good: 400, needsWork: 550 },
			maxG: { excellent: 2.0, good: 1.5, needsWork: 1.0 },
			consistency: { excellent: 3, good: 6, needsWork: 10 }
		};
	} else if (level.includes('elite') || level.includes('coach')) {
		return {
			reactionMs: { excellent: 160, good: 220, needsWork: 300 },
			maxG: { excellent: 3.8, good: 3.0, needsWork: 2.2 },
			consistency: { excellent: 2, good: 4, needsWork: 6 }
		};
	} else {
		// Rider / Club level (default)
		return {
			reactionMs: { excellent: 220, good: 300, needsWork: 420 },
			maxG: { excellent: 2.8, good: 2.2, needsWork: 1.6 },
			consistency: { excellent: 2, good: 5, needsWork: 8 }
		};
	}
}

export function generateRecommendations(
	reactionMs: number,
	maxG: number,
	consistencyCV: number | null,
	weaknesses: Weakness[],
	hasValidSpeed: boolean,
	profileComplete: boolean,
	riderLevel: string | null = null,
	performanceEngineRecommendations?: Array<{
		priority: 'high' | 'medium' | 'low';
		title: string;
		message: string;
	}>
): Recommendation[] {
	const recs: Recommendation[] = [];
	const THRESHOLDS = getRecommendationThresholds(riderLevel);

	// ── Profile completeness ──────────────────────────────────────────────────
	if (!profileComplete) {
		recs.push({
			priority: 'high',
			category: 'equipment',
			title: 'Complete your rider profile',
			insight: 'Power and biomechanical analytics need your weight, height and crank length.',
			advice: [
				'Add rider weight — required for power calculations',
				'Add bike weight — needed for combined mass in power estimation',
				'Add crank length — affects kinematic accuracy',
				'Select tyres from the library — measured diameters improve speed estimates'
			]
		});
	}

	// ── Reaction time ─────────────────────────────────────────────────────────
	if (reactionMs > THRESHOLDS.reactionMs.needsWork) {
		recs.push({
			priority: 'high',
			category: 'reaction',
			title: 'Reaction time — priority focus area',
			insight: `${(reactionMs / 1000).toFixed(3)}s is above the competitive threshold. This is the single biggest lever on race results at club level.`,
			advice: [
				'Daily random-cadence reaction drills — even 10 minutes compounds quickly',
				'Gate body position: weight forward, light on the gate, pedal loaded',
				'Develop a consistent pre-gate ritual: breathing, focus word, trigger cue',
				'Tension slows reaction — practice relaxing into the gate, not bracing',
				'Video your starts: seeing the reaction often reveals preparation inconsistencies'
			]
		});
	} else if (reactionMs > THRESHOLDS.reactionMs.good) {
		recs.push({
			priority: 'medium',
			category: 'reaction',
			title: 'Reaction time — marginal gains available',
			insight: `${(reactionMs / 1000).toFixed(3)}s is solid but there\'s time to find. The gap to excellent is ${((reactionMs - THRESHOLDS.reactionMs.excellent) / 1000).toFixed(3)}s.`,
			advice: [
				'Fine-tune gate position — small fore/aft adjustments can find 15–20ms',
				'Tighten your pre-gate routine for more consistent preparation state',
				'Practice under light competitive pressure — reaction improves with exposure'
			]
		});
	}

	// ── Power / G-force ───────────────────────────────────────────────────────
	if (maxG < THRESHOLDS.maxG.needsWork) {
		recs.push({
			priority: 'high',
			category: 'power',
			title: 'Power output — needs development',
			insight: `${maxG.toFixed(2)}G peak indicates limited explosive force. Power is the foundation the rest of the start is built on.`,
			advice: [
				'Explosive gym work: jump squats, power cleans, plyometric box jumps',
				'Maximum effort gate starts every session — quality over quantity',
				'First pedal technique: the entire power output must come in the first stroke',
				'Check gear ratio — too high a gear prevents expressing power at the gate',
				'Hip extension: the power comes from driving the hip through, not just the leg'
			]
		});
	} else if (maxG < THRESHOLDS.maxG.good) {
		recs.push({
			priority: 'medium',
			category: 'power',
			title: 'Power output — developing well',
			insight: `${maxG.toFixed(2)}G is competitive. Closing to ${THRESHOLDS.maxG.excellent}G+ is the next target.`,
			advice: [
				'Focus on front-loading power — peak G should come in the first 40% of the run',
				'Explosive strength work 2× per week maintains and builds the power base',
				"Ensure first pedal is at the right position — 2 o'clock is the standard starting point"
			]
		});
	}

	// ── Consistency ───────────────────────────────────────────────────────────
	if (consistencyCV !== null && consistencyCV > THRESHOLDS.consistency.needsWork) {
		recs.push({
			priority: 'high',
			category: 'consistency',
			title: 'Consistency — significant variability',
			insight: `CV of ${consistencyCV.toFixed(1)}% means race performance is unpredictable. Tightening this is high-value work.`,
			advice: [
				'Build a non-negotiable pre-gate routine: same sequence, same duration, every run',
				'Same breathing pattern, same focus point, same physical trigger before each start',
				'Reduce session volume temporarily — 6 quality starts beats 20 variable ones',
				"Film every start: find what's different between your best and worst runs",
				'Track fatigue — consistency often degrades in the second half of a session'
			]
		});
	} else if (consistencyCV !== null && consistencyCV > THRESHOLDS.consistency.good) {
		recs.push({
			priority: 'medium',
			category: 'consistency',
			title: 'Consistency — good, closing on excellent',
			insight: `CV of ${consistencyCV.toFixed(1)}% is acceptable. Elite riders typically target below 3%.`,
			advice: [
				'Tighten your pre-gate routine — the last 1–2% of CV comes from mental preparation',
				'More starts per session to deepen the movement memory'
			]
		});
	}

	// ── Weakness-derived recs ─────────────────────────────────────────────────
	for (const w of weaknesses.slice(0, 2)) {
		const alreadyCovered = recs.some(
			(r) =>
				r.title.toLowerCase().includes(w.area.toLowerCase()) ||
				r.advice.some((a) => a === w.advice[0])
		);
		if (!alreadyCovered) {
			recs.push({
				priority: w.score < 40 ? 'high' : w.score < 60 ? 'medium' : 'low',
				category: 'technique',
				title: `Technique: ${w.area}`,
				insight: `Score of ${w.score}/100 — this is a measurable drag on overall performance.`,
				advice: w.advice
			});
		}
	}

	// ── Speed data quality ────────────────────────────────────────────────────
	if (!hasValidSpeed) {
		recs.push({
			priority: 'low',
			category: 'equipment',
			title: 'Speed data unavailable for this run',
			insight: 'Firmware flagged invalid speed analytics — speed-based metrics are excluded.',
			advice: [
				'Check sensor placement — the IMU must be mounted securely with no movement',
				'Ensure the distance setting on the device matches actual gate distance',
				'If persistent across sessions, check firmware version'
			]
		});
	}

	// ── Integrate Performance Engine recommendations ──────────────────────────
	if (performanceEngineRecommendations) {
		for (const peRec of performanceEngineRecommendations) {
			// Check if recommendation is already covered
			const alreadyCovered = recs.some(
				(r) =>
					r.title.toLowerCase().includes(peRec.title.toLowerCase()) ||
					peRec.title.toLowerCase().includes(r.title.toLowerCase())
			);
			if (!alreadyCovered) {
				recs.push({
					priority: peRec.priority,
					category: 'technique',
					title: peRec.title,
					insight: peRec.message,
					advice: [peRec.message]
				});
			}
		}
	}

	return recs.sort((a, b) => {
		const order = { high: 0, medium: 1, low: 2 };
		return order[a.priority] - order[b.priority];
	});
}

// ─── G-Force Stability Across Session ────────────────────────────────────────

export interface SessionStabilityResult {
	runNumber: number;
	stability: number;
	isBest: boolean;
}

/**
 * Compute session-wide G-force stability for cross-run comparison
 * Now properly integrated and displayed in the session view
 */
export function computeSessionStability(
	runs: { run_number: number; chart_data: number[]; elapsed_time_ms: number | null }[]
): SessionStabilityResult[] {
	const results = runs.map((r) => ({
		runNumber: r.run_number,
		stability: computeGForceStability(r.chart_data as number[], r.elapsed_time_ms ?? 2000) ?? 0,
		isBest: false
	}));

	const best = Math.max(...results.map((r) => r.stability));
	results.forEach((r) => {
		r.isBest = r.stability === best;
	});
	return results;
}

/**
 * Get stability insight for the current run
 * Provides context on how this run compares to session average
 * EXPORTED for use in session page
 */
export function getStabilityInsight(
	currentStability: number | null,
	sessionResults: SessionStabilityResult[]
): string {
	if (!currentStability || sessionResults.length < 2) {
		return 'Single run - no comparison available';
	}

	const avgStability =
		sessionResults.reduce((sum, r) => sum + r.stability, 0) / sessionResults.length;
	const bestStability = Math.max(...sessionResults.map((r) => r.stability));
	const pctOfBest = (currentStability / bestStability) * 100;
	const pctOfAvg = (currentStability / avgStability) * 100;

	if (pctOfBest >= 95) {
		return `Excellent first 500ms stability — this is your best start of the session at ${currentStability.toFixed(2)}G`;
	} else if (pctOfAvg >= 105) {
		return `Above-average stability (${pctOfAvg.toFixed(0)}% of session average) — consistent power application`;
	} else if (pctOfAvg >= 95) {
		return `Typical stability for this session — consistent with your average start`;
	} else {
		return `Below session average (${pctOfAvg.toFixed(0)}% of typical) — check body position and initial stroke timing`;
	}
}

// ─── Circular gauge path helper ───────────────────────────────────────────────

export function gaugeArcPath(score: number, _radius = 15.9155): string {
	const pct = Math.min(100, Math.max(0, score));
	return `${pct}, 100`;
}

/**
 * Phase Analysis - Detailed Drive/Transition/Velocity breakdown
 *
 * Algorithm notes (vs initial PE migration):
 *   - Accel data is smoothed (5-sample MA) before phase detection, matching the
 *     jerk computation in physics.ts. Raw IMU data is too noisy for reliable
 *     phase boundary detection.
 *   - driveEnd uses a 0.3G threshold drop + jerk-based fallback (sign reversal),
 *     which catches riders whose peak decays slowly vs. those with an abrupt drop.
 *   - Velocities come from Euler integration of the *smoothed* accel trace, which
 *     gives correct phase-boundary velocities (consistent with physics.ts).
 *   - Inflection is detected from velocity gradient rather than raw accel threshold,
 *     making it sensitive to the transition from acceleration to cruise.
 *   - driveEff = velocity-at-driveEnd / (ideal ramp velocity) — physically meaningful.
 *   - transEff = 1 - normalised jerk magnitude through the transition window.
 */

const GRAVITY_MS2 = 9.80665;

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

/**
 * Compute detailed phase analysis for a single run.
 * Analyses drive, transition, and velocity maintenance phases.
 */
export function computeDetailedPhases(chartData: number[], elapsedMs: number): PhaseMetrics | null {
	if (!chartData || chartData.length < 10 || !elapsedMs) return null;

	const dt = elapsedMs / 1000 / chartData.length;

	// 5-sample moving average — matches physics.ts computeJerk smoothing.
	const smooth = (data: number[], w = 5): number[] =>
		data.map((_, i) => {
			const s = Math.max(0, i - Math.floor(w / 2));
			const e = Math.min(data.length, i + Math.floor(w / 2) + 1);
			return data.slice(s, e).reduce((a, b) => a + b, 0) / (e - s);
		});

	const accelMs2 = smooth(chartData.map((g) => g * GRAVITY_MS2));
	const peakAccel = Math.max(...accelMs2);
	const peakIdx = accelMs2.indexOf(peakAccel);

	// ── Drive phase ──────────────────────────────────────────────────────────
	// Primary: accel drops below 30% of peak (power clearly fading).
	// Fallback: jerk sign flips sharply (abrupt end of drive stroke).
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

	// ── Euler integration of smoothed accel ─────────────────────────────────
	let vel = 0;
	const velocities: number[] = [];
	for (const a of accelMs2) {
		vel += a * dt;
		velocities.push(vel);
	}

	const peakVel = Math.max(...velocities);
	const peakVelIdx = velocities.indexOf(peakVel);

	// ── Inflection: velocity gradient starts decelerating ───────────────────
	const velGrad = velocities.slice(1).map((v, i) => v - velocities[i]);
	let inflection = driveEnd;
	for (let i = driveEnd + 1; i < velGrad.length - 1; i++) {
		if (velGrad[i] < velGrad[i - 1] * 0.8) {
			inflection = i;
			break;
		}
	}

	// ── Efficiency metrics ───────────────────────────────────────────────────
	// Drive efficiency: actual velocity-at-driveEnd vs ideal constant-accel ramp.
	// An ideal rider with perfect constant peak accel would reach
	// (driveEnd * dt * peakAccel) m/s at driveEnd — we measure how close they got.
	const driveEff =
		driveEnd > 0 && peakAccel > 0 ? velocities[driveEnd] / (driveEnd * dt * peakAccel) : 0;

	// Transition efficiency: smoothness through the transition window.
	// Low jerk = smooth transition = higher score.
	const transJerks = jerk.slice(driveEnd, inflection).map(Math.abs);
	const baseJerk = Math.abs(jerk[driveEnd] || 1);
	const transEff =
		transJerks.length > 0
			? Math.max(0, 1 - transJerks.reduce((a, b) => a + b, 0) / transJerks.length / baseJerk)
			: 0.5;

	// Velocity maintenance: average speed through velocity phase vs peak speed.
	const velPhaseVels = velocities.slice(inflection);
	const velMaint =
		velPhaseVels.length > 0 && peakVel > 0
			? velPhaseVels.reduce((a, b) => a + b, 0) / (velPhaseVels.length * peakVel)
			: 0;

	// ── Technical assessment ─────────────────────────────────────────────────
	let technicalAssessment: string;
	if (driveEff > 0.8 && transEff > 0.7 && velMaint > 0.9) {
		technicalAssessment = 'Elite technical performance — optimal phase transitions throughout';
	} else if (driveEff > 0.7 && transEff > 0.6 && velMaint > 0.8) {
		technicalAssessment = 'Strong technical performance with good phase management';
	} else if (driveEff > 0.8 && (transEff < 0.6 || velMaint < 0.8)) {
		technicalAssessment =
			'Explosive drive phase — focus on smoother transition and velocity maintenance';
	} else if (driveEff < 0.7 && transEff > 0.7 && velMaint > 0.8) {
		technicalAssessment = 'Good velocity profile — initial drive power needs improvement';
	} else {
		technicalAssessment =
			'Technical improvements available across all phases — consistent practice will close the gaps';
	}

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

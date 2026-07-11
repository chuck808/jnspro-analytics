import {
	getBenchmarks,
	labelScore,
	scoreAgainstHigherIsBetter,
	scoreAgainstLowerIsBetter
} from './benchmarks';
import type { RunAnalysis, SessionAnalysis } from './types';

export interface TechniqueScoreBreakdown {
	launchQuality: number | null;
	explosiveness: number | null;
	impulseTiming: number | null;
	speedCarry: number | null;
	smoothness: number | null;
	repeatability: number | null;
	overall: number | null;
	labels: {
		launchQuality: ReturnType<typeof labelScore>;
		explosiveness: ReturnType<typeof labelScore>;
		impulseTiming: ReturnType<typeof labelScore>;
		speedCarry: ReturnType<typeof labelScore>;
		smoothness: ReturnType<typeof labelScore>;
		repeatability: ReturnType<typeof labelScore>;
		overall: ReturnType<typeof labelScore>;
	};
}

export interface TechniqueScoreOptions {
	riderLevel?: string | null;
}

export function scoreRunTechnique(
	run: RunAnalysis | null,
	session?: SessionAnalysis | null,
	options: TechniqueScoreOptions = {}
): TechniqueScoreBreakdown {
	const b = getBenchmarks(options.riderLevel);
	const physics = run?.physics;

	const launchQuality = scoreAgainstLowerIsBetter(
		run?.reactionMs,
		b.reactionMs.excellent,
		b.reactionMs.needsWork
	);
	const peakG =
		run?.maxG ??
		(physics?.accelerationG.length ? Math.max(...physics.accelerationG.map(Math.abs)) : null);
	const explosiveness = scoreAgainstHigherIsBetter(peakG, b.peakG.good, b.peakG.excellent);
	const impulseTiming = scoreAgainstLowerIsBetter(
		physics?.impulse?.timeToNinetyPctImpulseS,
		b.timeTo90ImpulseS.excellent,
		b.timeTo90ImpulseS.needsWork
	);
	const speedCarry = scoreSpeedCarry(
		physics?.speedKmh,
		b.speedCarryRatio.good,
		b.speedCarryRatio.excellent
	);
	const smoothness =
		typeof physics?.jerk?.smoothnessScore === 'number'
			? normaliseExistingScore(physics.jerk.smoothnessScore)
			: (run?.technique?.smoothness ?? null);
	const repeatability = session?.summary.consistencyScore ?? null;

	const overall = weightedAverage([
		[launchQuality, 0.18],
		[explosiveness, 0.22],
		[impulseTiming, 0.18],
		[speedCarry, 0.18],
		[smoothness, 0.14],
		[repeatability, 0.1]
	]);

	return {
		launchQuality,
		explosiveness,
		impulseTiming,
		speedCarry,
		smoothness,
		repeatability,
		overall,
		labels: {
			launchQuality: labelScore(launchQuality),
			explosiveness: labelScore(explosiveness),
			impulseTiming: labelScore(impulseTiming),
			speedCarry: labelScore(speedCarry),
			smoothness: labelScore(smoothness),
			repeatability: labelScore(repeatability),
			overall: labelScore(overall)
		}
	};
}

function scoreSpeedCarry(
	speeds: number[] | null | undefined,
	good: number,
	excellent: number
): number | null {
	if (!speeds?.length) return null;
	const peak = Math.max(...speeds);
	if (!peak || peak <= 0) return null;

	const lastThird = speeds.slice(Math.floor(speeds.length * 0.66));
	const carried = lastThird.length ? Math.max(...lastThird) : speeds[speeds.length - 1];
	const ratio = carried / peak;
	return scoreAgainstHigherIsBetter(ratio, good, excellent);
}

function normaliseExistingScore(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedAverage(items: Array<[number | null | undefined, number]>): number | null {
	let weighted = 0;
	let totalWeight = 0;
	for (const [value, weight] of items) {
		if (typeof value !== 'number' || !Number.isFinite(value)) continue;
		weighted += value * weight;
		totalWeight += weight;
	}
	return totalWeight ? Math.round(weighted / totalWeight) : null;
}

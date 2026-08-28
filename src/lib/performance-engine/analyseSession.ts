import { coefficientOfVariation, max, mean, min, round } from './math';
import {
	computeSpeedCurve,
	estimatePower,
	analyseImpulse,
	computeJerk,
	calculateSpeedSplits,
	classifySpeedProfile
} from './physics';
import { scoreConsistencyFromCv, scoreTechnique } from './technique';
import { generateRecommendations, identifyWeaknesses } from './recommendations';
import { runPhysicsDiagnostics, hasBlockingCalibrationIssue } from './diagnostics';
import { assessDataQuality } from './dataQuality';
import { analyseSessionIntelligence } from './sessionIntelligence';
import type { RiderContext, RunAnalysis, RunLike, SessionAnalysis, SessionLike } from './types';

export interface AnalyseSessionOptions {
	selectedRunIndex?: number;
}

export function analyseSession(
	session: SessionLike,
	rider: RiderContext = {},
	options: AnalyseSessionOptions = {}
): SessionAnalysis {
	const runs = session.runs ?? [];
	const totalMassKg = getTotalMassKg(rider);

	const analysedRuns = runs.map((run) => analyseRun(run, rider, totalMassKg));
	const selectedRun = analysedRuns[options.selectedRunIndex ?? 0] ?? analysedRuns[0] ?? null;

	const reactionTimes = analysedRuns
		.map((r) => r.reactionMs)
		.filter((v): v is number => typeof v === 'number');
	const maxGs = analysedRuns.map((r) => r.maxG).filter((v): v is number => typeof v === 'number');
	const peakSpeeds = analysedRuns
		.map(
			(r) =>
				r.physics?.measuredPeakSpeedKmh ??
				(r.physics?.speedKmh.length ? Math.max(...r.physics.speedKmh) : null)
		)
		.filter((v): v is number => typeof v === 'number');

	const cv = coefficientOfVariation(reactionTimes);
	const consistency = scoreConsistencyFromCv(cv);

	const bestReaction = min(reactionTimes);
	const bestRun =
		bestReaction === null
			? null
			: (analysedRuns.find((r) => r.reactionMs === bestReaction) ?? null);

	const summary = {
		runCount: runs.length,
		validRunCount: analysedRuns.filter((r) => r.analyticsValid).length,
		bestReactionMs: bestReaction,
		averageReactionMs: round(mean(reactionTimes), 1),
		peakG: round(max(maxGs), 2),
		averageMaxG: round(mean(maxGs), 2),
		peakSpeedKmh: round(max(peakSpeeds), 1),
		consistencyScore: consistency.score,
		consistencyLabel: consistency.label,
		bestRunNumber: bestRun?.runNumber ?? null
	};

	const provisional = {
		summary,
		selectedRun
	} as Pick<SessionAnalysis, 'summary' | 'selectedRun'>;

	const diagnostics = analysedRuns.flatMap((r) => r.diagnostics ?? []);
	const weaknesses = identifyWeaknesses(provisional, rider);
	const profileComplete = !!(rider.riderWeightKg && rider.bikeWeightKg);
	const recommendations = generateRecommendations(
		{ ...provisional, profileComplete },
		weaknesses,
		rider
	);
	const hasCalibrationWarning = hasBlockingCalibrationIssue(diagnostics);

	// Session Intelligence - use the full intelligence analysis
	let intelligence: SessionAnalysis['intelligence'] = null;
	if (reactionTimes.length > 0) {
		// Field names must match the RunData interface in repeatability.ts.
		// Preserve the physical run number before filtering so downstream analyses
		// that make a "Run N" claim do not confuse filtered-array position with run identity.
		const runData = analysedRuns
			.map((r) => ({
				runNumber: r.runNumber,
				reactionTime: r.reactionMs,
				peakSpeed:
					r.physics?.measuredPeakSpeedKmh ??
					(r.physics?.speedKmh.length ? Math.max(...r.physics.speedKmh) : null),
				peakG: r.maxG
			}))
			.filter((r) => r.reactionTime !== null);

		if (runData.length > 0) {
			// Store the full SessionIntelligenceReport directly
			intelligence = analyseSessionIntelligence(runData);
		}
	}

	return {
		summary,
		selectedRun,
		runs: analysedRuns,
		weaknesses,
		recommendations,
		profileComplete,
		diagnostics,
		hasCalibrationWarning,
		intelligence,
		context: rider,
		units: {
			acceleration: 'g',
			speed: 'km/h',
			distance: 'm',
			power: 'W',
			impulse: 'N·s'
		}
	};
}

export function analyseRun(run: RunLike, rider: RiderContext, totalMassKg?: number): RunAnalysis {
	const gate = run.gate_runs;
	const reactionMs = gate?.reaction_time_ms ?? null;
	const maxG = gate?.max_g ?? null;
	const analyticsValid = gate?.analytics_valid ?? false;
	const elapsedTimeMs = run.elapsed_time_ms ?? null;
	const chartData = run.chart_data ?? [];
	const sampleIntervalMs = run.sample_interval_ms ?? 10;

	const dataQuality = assessDataQuality(run);
	const diagnostics = runPhysicsDiagnostics(run, rider);

	let physics: RunAnalysis['physics'] = null;
	if (chartData.length > 0) {
		const speedKmh = computeSpeedCurve(chartData, sampleIntervalMs);
		const measuredPeakSpeedKmh = gate?.peak_speed_ms != null ? gate.peak_speed_ms * 3.6 : null;
		const measuredAvgSpeedKmh = gate?.avg_speed_ms_calc != null ? gate.avg_speed_ms_calc * 3.6 : null;
		const measuredEndSpeedKmh = gate?.speed_ms != null ? gate.speed_ms * 3.6 : null;
		const rawCurvePeak = max(speedKmh);
		const scale =
			measuredPeakSpeedKmh != null && rawCurvePeak != null && rawCurvePeak > 0
				? measuredPeakSpeedKmh / rawCurvePeak
				: 1;
		const scaledSpeedKmh = speedKmh.map((v) => v * scale);
		const peakSpeedKmh = measuredPeakSpeedKmh ?? max(scaledSpeedKmh);
		const distanceM =
			elapsedTimeMs != null ? estimateDistance(scaledSpeedKmh, sampleIntervalMs) : null;
		const peakGValue = maxG ?? max(chartData);
		const powerW =
			peakGValue != null && totalMassKg != null
				? estimatePower(peakGValue, totalMassKg, peakSpeedKmh ?? 0)
				: null;
		const impulse = analyseImpulse(chartData, sampleIntervalMs);
		const jerk = computeJerk(chartData, sampleIntervalMs);
		const speedSplits = calculateSpeedSplits(scaledSpeedKmh, sampleIntervalMs);
		const speedProfile = classifySpeedProfile(scaledSpeedKmh);

		physics = {
			speedKmh: scaledSpeedKmh,
			measuredPeakSpeedKmh,
			measuredAvgSpeedKmh,
			measuredEndSpeedKmh,
			speedCurveEstimated: true,
			peakSpeedKmh,
			distanceM,
			powerW,
			impulse,
			jerk,
			speedSplits,
			speedProfile
		};
	}

	const technique = scoreTechnique({
		reactionMs,
		maxG,
		chartData,
		sampleIntervalMs
	});

	return {
		runNumber: run.run_number,
		reactionMs,
		maxG,
		analyticsValid,
		dataQuality,
		diagnostics,
		physics,
		technique
	};
}

function getTotalMassKg(rider: RiderContext): number | undefined {
	if (rider.riderWeightKg == null || rider.bikeWeightKg == null) return undefined;
	return rider.riderWeightKg + rider.bikeWeightKg;
}

function estimateDistance(speedKmh: number[], sampleIntervalMs: number): number {
	const dtSeconds = sampleIntervalMs / 1000;
	return speedKmh.reduce((sum, kmh) => sum + (kmh / 3.6) * dtSeconds, 0);
}

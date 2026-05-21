import { coefficientOfVariation, max, mean, min, round } from './math';
import { computeSpeedCurve, estimatePower, analyseImpulse, computeJerk, calculateSpeedSplits, classifySpeedProfile } from './physics';
import { scoreConsistencyFromCv, scoreTechnique } from './technique';
import { generateRecommendations, identifyWeaknesses } from './recommendations';
import { runPhysicsDiagnostics, hasBlockingCalibrationIssue } from './diagnostics';
import { assessDataQuality } from './dataQuality';
import { analyseSessionIntelligence } from './sessionIntelligence';
import type { RiderContext, RunAnalysis, RunLike, SessionAnalysis, SessionLike } from './types';

export interface AnalyseSessionOptions {
  selectedRunIndex?: number;
}

export function analyseSession(session: SessionLike, rider: RiderContext = {}, options: AnalyseSessionOptions = {}): SessionAnalysis {
  const runs = session.runs ?? [];
  const totalMassKg = getTotalMassKg(rider);

  const analysedRuns = runs.map(run => analyseRun(run, rider, totalMassKg));
  const selectedRun = analysedRuns[options.selectedRunIndex ?? 0] ?? analysedRuns[0] ?? null;

  const reactionTimes = analysedRuns.map(r => r.reactionMs).filter((v): v is number => typeof v === 'number');
  const maxGs = analysedRuns.map(r => r.maxG).filter((v): v is number => typeof v === 'number');
  const peakSpeeds = analysedRuns
    .map(r => r.physics?.speedKmh.length ? Math.max(...r.physics.speedKmh) : null)
    .filter((v): v is number => typeof v === 'number');

  const cv = coefficientOfVariation(reactionTimes);
  const consistency = scoreConsistencyFromCv(cv);

  const bestReaction = min(reactionTimes);
  const bestRun = bestReaction === null
    ? null
    : analysedRuns.find(r => r.reactionMs === bestReaction) ?? null;

  const summary = {
    runCount: runs.length,
    validRunCount: analysedRuns.filter(r => r.analyticsValid).length,
    bestReactionMs: bestReaction,
    averageReactionMs: round(mean(reactionTimes), 1),
    peakG: round(max(maxGs), 2),
    averageMaxG: round(mean(maxGs), 2),
    peakSpeedKmh: round(max(peakSpeeds), 1),
    consistencyScore: consistency.score,
    consistencyLabel: consistency.label,
    bestRunNumber: bestRun?.runNumber ?? null,
  };

  const provisional = {
    summary,
    selectedRun,
  } as Pick<SessionAnalysis, 'summary' | 'selectedRun'>;

  const diagnostics = analysedRuns.flatMap(r => r.diagnostics ?? []);
  const weaknesses = identifyWeaknesses(provisional, rider);
  const profileComplete = !!(rider.riderWeightKg && rider.bikeWeightKg);
  const recommendations = generateRecommendations({ ...provisional, profileComplete }, weaknesses, rider);
  const hasCalibrationWarning = hasBlockingCalibrationIssue(diagnostics);

  // Session Intelligence - use the full intelligence analysis
  let intelligence: SessionAnalysis['intelligence'] = null;
  if (reactionTimes.length > 0) {
    // Field names must match the RunData interface in repeatability.ts:
    // { reactionTime, peakSpeed, peakG } — not reactionMs/maxG.
    // Using the wrong names caused reaction time to be silently dropped from
    // repeatability scoring (the .filter Boolean pass left an empty array).
    const runData = analysedRuns.map(r => ({
      reactionTime: r.reactionMs,
      peakSpeed: r.physics?.speedKmh.length ? Math.max(...r.physics.speedKmh) : null,
      peakG: r.maxG
    })).filter(r => r.reactionTime !== null);

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
    units: {
      acceleration: 'g',
      speed: 'km/h',
      distance: 'm',
      power: 'W',
      impulse: 'N·s',
    },
  };
}

export function analyseRun(run: RunLike, rider: RiderContext, totalMassKg?: number | null): RunAnalysis {
  const chartData = Array.isArray(run.chart_data) ? run.chart_data : [];
  const elapsedMs = typeof run.elapsed_time_ms === 'number' ? run.elapsed_time_ms : 2000;
  const gate = run.gate_runs ?? null;
  const reactionMs = typeof gate?.reaction_time_ms === 'number' ? gate.reaction_time_ms : null;
  const maxG = typeof gate?.max_g === 'number' ? gate.max_g : chartData.length ? Math.max(...chartData) : null;
  const analyticsValid = gate?.analytics_valid ?? chartData.length > 1;

  if (!chartData.length) {
    return {
      runNumber: run.run_number ?? null,
      elapsedMs,
      reactionMs,
      maxG,
      analyticsValid: false,
      physics: null,
      technique: null,
      diagnostics: [{
        code: 'NO_CHART_DATA',
        severity: 'warning',
        area: 'data',
        message: 'This run has no chart_data trace, so physics analysis is unavailable.',
        suggestion: 'Check that the uploaded session includes device trace data.',
      }],
    };
  }

  // Get firmware-measured peak speed to scale the predicted curve
  const actualPeakSpeedKmh = gate?.peak_speed_ms ? gate.peak_speed_ms * 3.6 : null;
  const curve = computeSpeedCurve(chartData, elapsedMs, gate?.bias_correction_ms2 ?? 0, actualPeakSpeedKmh);
  const technique = scoreTechnique(reactionMs, chartData, curve, rider.riderLevel);
  const jerk = computeJerk(chartData, elapsedMs);
  const power = estimatePower(chartData, curve, totalMassKg);
  const impulse = analyseImpulse(chartData, elapsedMs, totalMassKg);
  
  // Legacy-migrated features now in Performance Engine
  const peakSpeedKmh = curve.speeds.length > 0 ? Math.max(...curve.speeds) : 0;
  const speedSplits = peakSpeedKmh > 0 ? calculateSpeedSplits(curve, peakSpeedKmh) : [];
  const speedProfile = classifySpeedProfile(gate?.time_to_peak_speed_ms ?? null, elapsedMs);
  const dataQuality = assessDataQuality(gate?.bias_correction_ms2);

  const physics = {
    timesS: curve.times,
    accelerationG: curve.accels,
    speedKmh: curve.speeds,
    distanceM: curve.distances,
    jerkSeries: jerk?.series ?? [],
    impulseSeries: impulse?.series ?? [],
    powerSeries: power?.series ?? [],
    jerk: jerk ? { meanAbsolute: jerk.meanAbsolute, smoothnessScore: jerk.smoothnessScore, insight: jerk.insight } : null,
    impulse: impulse ? {
      totalImpulseNs: impulse.totalImpulseNs,
      timeToHalfImpulseS: impulse.timeToHalfImpulseS,
      timeToNinetyPctImpulseS: impulse.timeToNinetyPctImpulseS,
      frontLoadedScore: impulse.frontLoadedScore,
      impulseEfficiency: impulse.impulseEfficiency,
    } : null,
    power: power ? { peakW: power.peakW, averageW: power.averageW, estimated: true as const } : null,
    speedSplits,
    speedProfile,
    dataQuality: {
      rating: dataQuality.rating,
      label: dataQuality.label,
      color: dataQuality.color,
      badge: dataQuality.badge,
      description: dataQuality.description,
      bias: dataQuality.bias,
    },
  };

  const diagnostics = runPhysicsDiagnostics(physics);

  return {
    runNumber: run.run_number ?? null,
    elapsedMs,
    reactionMs,
    maxG,
    analyticsValid,
    physics,
    technique,
    diagnostics,
  };
}

function getTotalMassKg(rider: RiderContext): number | null {
  const riderWeight = rider.riderWeightKg ?? 0;
  const bikeWeight = rider.bikeWeightKg ?? 0;
  const total = riderWeight + bikeWeight;
  return total > 0 ? total : null;
}
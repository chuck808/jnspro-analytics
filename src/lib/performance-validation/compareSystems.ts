import type {
  AgreementStatus,
  EngineValidationInput,
  MetricComparison,
  SplitComparison,
  ValidationReport,
  ValidationThresholds
} from './types';

const DEFAULT_THRESHOLDS: ValidationThresholds = {
  passPercent: 5,
  warnPercent: 15,
  maxPlausibleSpeedKmh: 75,
  maxPlausibleDistanceM: 100,
  maxPlausiblePeakG: 5
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function percentDifference(a: number, b: number): number | null {
  const denominator = Math.max(Math.abs(a), Math.abs(b));
  if (denominator === 0) return null;
  return (Math.abs(a - b) / denominator) * 100;
}

function statusFromPercent(diff: number | null, thresholds: ValidationThresholds): AgreementStatus {
  if (diff === null) return 'unknown';
  if (diff <= thresholds.passPercent) return 'pass';
  if (diff <= thresholds.warnPercent) return 'warn';
  return 'fail';
}

function worstStatus(statuses: AgreementStatus[]): AgreementStatus {
  if (statuses.includes('fail')) return 'fail';
  if (statuses.includes('warn')) return 'warn';
  if (statuses.includes('pass')) return 'pass';
  return 'unknown';
}

function lastValue(series?: { value: number }[]): number | null {
  if (!series?.length) return null;
  const value = series[series.length - 1]?.value;
  return isFiniteNumber(value) ? value : null;
}

function maxValue(series?: { value: number }[]): number | null {
  if (!series?.length) return null;
  const values = series.map((p) => p.value).filter(isFiniteNumber);
  return values.length ? Math.max(...values) : null;
}

function findCrossing(series: { timeS: number; value: number }[] | undefined, target: number): { timeS: number; value: number } | null {
  if (!series?.length) return null;
  return series.find((point) => point.value >= target) ?? null;
}

function compareMetric(
  key: string,
  label: string,
  existingValue: number | null | undefined,
  engineValue: number | null | undefined,
  unit: string,
  thresholds: ValidationThresholds
): MetricComparison {
  const existing = isFiniteNumber(existingValue) ? existingValue : null;
  const engine = isFiniteNumber(engineValue) ? engineValue : null;

  if (existing === null || engine === null) {
    return {
      key,
      label,
      existingValue: existing,
      engineValue: engine,
      unit,
      difference: null,
      differencePercent: null,
      status: 'unknown',
      message: 'Not enough data to compare this metric.'
    };
  }

  const difference = engine - existing;
  const differencePercent = percentDifference(existing, engine);
  const status = statusFromPercent(differencePercent, thresholds);
  const rounded = differencePercent === null ? 'unknown' : `${differencePercent.toFixed(1)}%`;

  return {
    key,
    label,
    existingValue: existing,
    engineValue: engine,
    unit,
    difference,
    differencePercent,
    status,
    message:
      status === 'pass'
        ? `${label} agrees within ${rounded}.`
        : status === 'warn'
          ? `${label} differs by ${rounded}; review before merging.`
          : `${label} differs by ${rounded}; likely calibration or integration mismatch.`
  };
}

export function compareSystems(input: EngineValidationInput): ValidationReport {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(input.thresholds ?? {}) };
  const existing = input.existingAppAnalytics;
  const engine = input.engineAnalysis;
  const speedSeries = input.chartSeries?.speed;
  const distanceSeries = input.chartSeries?.distance;
  const accelerationSeries = input.chartSeries?.acceleration;

  const existingPeakSpeed = existing?.curve?.speeds?.length
    ? Math.max(...existing.curve.speeds)
    : null;
  const enginePeakSpeed = engine.summary?.peakSpeedKmh ?? maxValue(speedSeries);

  const stabilityPeakG = (existing?.sessionStability && typeof existing.sessionStability === 'object' && 'peakG' in existing.sessionStability)
    ? (existing.sessionStability as { peakG: number }).peakG
    : null;
  const phasePeakG = (existing?.phaseMetrics && typeof existing.phaseMetrics === 'object' && 'peakG' in existing.phaseMetrics)
    ? (existing.phaseMetrics as { peakG: number }).peakG
    : null;
  const existingPeakG = stabilityPeakG ?? phasePeakG ?? null;
  const enginePeakG = engine.summary?.peakG ?? maxValue(accelerationSeries);

  const existingDistance = existing?.curve?.distances?.length
    ? existing.curve.distances[existing.curve.distances.length - 1]
    : null;
  const engineDistance = lastValue(distanceSeries);

  const metricComparisons: MetricComparison[] = [
    compareMetric('peakSpeed', 'Peak speed', existingPeakSpeed, enginePeakSpeed, 'km/h', thresholds),
    compareMetric('peakG', 'Peak acceleration', existingPeakG, enginePeakG, 'g', thresholds),
    compareMetric('distance', 'Final distance', existingDistance, engineDistance, 'm', thresholds)
  ];

  const existingSplits = existing?.splits ?? [];
  const splitComparisons: SplitComparison[] = existingSplits.map((split: any) => {
    const targetKmh = split.targetKmh ?? split.target ?? split.speedKmh;
    const engineCrossing = findCrossing(speedSeries, targetKmh);
    const engineDistanceAtCrossing = engineCrossing
      ? distanceSeries?.find((point) => Math.abs(point.timeS - engineCrossing.timeS) < 0.0001)?.value ?? null
      : null;

    const existingTimeS = isFiniteNumber(split.time) ? split.time : isFiniteNumber(split.timeS) ? split.timeS : null;
    const existingDistanceM = isFiniteNumber(split.distance) ? split.distance : isFiniteNumber(split.distanceM) ? split.distanceM : null;
    const engineTimeS = engineCrossing?.timeS ?? null;

    const timeDiff = existingTimeS !== null && engineTimeS !== null ? engineTimeS - existingTimeS : null;
    const distanceDiff = existingDistanceM !== null && engineDistanceAtCrossing !== null ? engineDistanceAtCrossing - existingDistanceM : null;
    const timeDiffPercent = existingTimeS !== null && engineTimeS !== null ? percentDifference(existingTimeS, engineTimeS) : null;

    return {
      targetKmh,
      existingTimeS,
      engineTimeS,
      existingDistanceM,
      engineDistanceM: engineDistanceAtCrossing,
      timeDifferenceS: timeDiff,
      distanceDifferenceM: distanceDiff,
      status: statusFromPercent(timeDiffPercent, thresholds)
    };
  });

  const statuses = [...metricComparisons.map((m) => m.status), ...splitComparisons.map((s) => s.status)];
  let overallStatus = worstStatus(statuses);

  const likelyIssues: string[] = [];
  const suggestedChecks: string[] = [];

  const speedComparison = metricComparisons.find((m) => m.key === 'peakSpeed');
  const distanceComparison = metricComparisons.find((m) => m.key === 'distance');
  const peakGComparison = metricComparisons.find((m) => m.key === 'peakG');

  if ((enginePeakSpeed ?? 0) > thresholds.maxPlausibleSpeedKmh) {
    likelyIssues.push('Engine speed is implausibly high for BMX gate/sprint analysis.');
    suggestedChecks.push('Check elapsed time units: milliseconds may be treated as seconds, or vice versa.');
    overallStatus = 'fail';
  }

  if ((existingPeakSpeed ?? 0) > thresholds.maxPlausibleSpeedKmh) {
    likelyIssues.push('Existing app speed is implausibly high for BMX gate/sprint analysis.');
    suggestedChecks.push('Check whether speed is being converted to km/h more than once.');
    overallStatus = 'fail';
  }

  if ((enginePeakG ?? 0) > thresholds.maxPlausiblePeakG || (existingPeakG ?? 0) > thresholds.maxPlausiblePeakG) {
    likelyIssues.push('Peak G is unusually high; acceleration scale may be wrong or spikes need filtering.');
    suggestedChecks.push('Confirm raw accelerometer units and apply smoothing/spike rejection before integration.');
  }

  if (speedComparison?.status === 'fail' && peakGComparison?.status === 'pass') {
    likelyIssues.push('Acceleration scale agrees, but speed does not; integration or time delta handling is likely different.');
    suggestedChecks.push('Compare the dt calculation used by each system for the same selected run.');
  }

  if (speedComparison?.status === 'fail' && distanceComparison?.status === 'fail') {
    likelyIssues.push('Speed and distance both differ; the systems are probably integrating different source series.');
    suggestedChecks.push('Confirm both systems use the same selected run, same axis, same bias correction and same smoothing.');
  }

  for (const warning of engine.diagnostics?.warnings ?? []) likelyIssues.push(warning);
  for (const error of engine.diagnostics?.errors ?? []) likelyIssues.push(error);

  const shouldTrustSpeed = overallStatus !== 'fail' && engine.diagnostics?.shouldTrustSpeed !== false;
  const shouldTrustPower = shouldTrustSpeed && engine.diagnostics?.shouldTrustPower !== false;

  const summary =
    overallStatus === 'pass'
      ? 'Existing analytics and Performance Engine agree closely enough to start merging selected metrics.'
      : overallStatus === 'warn'
        ? 'Existing analytics and Performance Engine mostly agree, but review differences before merging.'
        : overallStatus === 'fail'
          ? 'Existing analytics and Performance Engine disagree. Keep bridge mode active and fix calibration before merging.'
          : 'Not enough shared data to validate both systems yet.';

  return {
    overallStatus,
    metricComparisons,
    splitComparisons,
    likelyIssues: [...new Set(likelyIssues)],
    suggestedChecks: [...new Set(suggestedChecks)],
    shouldTrustSpeed,
    shouldTrustPower,
    summary
  };
}

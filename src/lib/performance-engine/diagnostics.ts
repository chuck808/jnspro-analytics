import { round } from './math';
import type { PhysicsAnalysis } from './types';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface PerformanceDiagnostic {
  code: string;
  severity: DiagnosticSeverity;
  area: 'data' | 'calibration' | 'speed' | 'power' | 'impulse' | 'profile';
  message: string;
  value?: number | string | null;
  suggestion?: string;
}

export interface DiagnosticThresholds {
  /** BMX gate / first-straight sanity threshold. Anything above this should be treated as suspect. */
  maxPlausibleSpeedKmh: number;
  /** Values above this are not impossible in all contexts, but should be treated as cautionary. */
  cautionSpeedKmh: number;
  /** Estimated mechanical peak power threshold. Above this normally indicates calibration or integration error. */
  maxPlausiblePowerW: number;
  /** Strong BMX starts can be high, but sustained/derived values above this need checking. */
  maxPlausiblePeakG: number;
}

export const DEFAULT_DIAGNOSTIC_THRESHOLDS: DiagnosticThresholds = {
  maxPlausibleSpeedKmh: 75,
  cautionSpeedKmh: 60,
  maxPlausiblePowerW: 3000,
  maxPlausiblePeakG: 5,
};

export function runPhysicsDiagnostics(
  physics: PhysicsAnalysis | null | undefined,
  thresholds: DiagnosticThresholds = DEFAULT_DIAGNOSTIC_THRESHOLDS,
): PerformanceDiagnostic[] {
  const diagnostics: PerformanceDiagnostic[] = [];
  if (!physics) return diagnostics;

  const peakSpeed = maxFinite(physics.speedKmh);
  const peakG = maxFinite(physics.accelerationG);
  const peakPower = physics.power?.peakW ?? null;
  const totalImpulse = physics.impulse?.totalImpulseNs ?? null;

  if (peakSpeed !== null && peakSpeed > thresholds.maxPlausibleSpeedKmh) {
    diagnostics.push({
      code: 'SPEED_IMPLAUSIBLE_HIGH',
      severity: 'error',
      area: 'speed',
      value: `${round(peakSpeed, 1)} km/h`,
      message: 'Estimated peak speed is above the normal BMX sanity range.',
      suggestion: 'Check elapsed time units, accelerometer scale, integration drift and whether speed has been converted to km/h more than once.',
    });
  } else if (peakSpeed !== null && peakSpeed > thresholds.cautionSpeedKmh) {
    diagnostics.push({
      code: 'SPEED_HIGH_CAUTION',
      severity: 'warning',
      area: 'speed',
      value: `${round(peakSpeed, 1)} km/h`,
      message: 'Estimated peak speed is high. It may be valid, but should be checked against known distance/time.',
      suggestion: 'Validate against a timed distance split before using power estimates.',
    });
  }

  if (peakPower !== null && peakPower > thresholds.maxPlausiblePowerW) {
    diagnostics.push({
      code: 'POWER_IMPLAUSIBLE_HIGH',
      severity: 'error',
      area: 'power',
      value: `${Math.round(peakPower)} W`,
      message: 'Estimated peak power is outside a useful coaching range.',
      suggestion: 'Power depends on both acceleration and integrated speed. Fix speed calibration before trusting power.',
    });
  }

  if (peakG !== null && peakG > thresholds.maxPlausiblePeakG) {
    diagnostics.push({
      code: 'PEAK_G_HIGH_CAUTION',
      severity: 'warning',
      area: 'calibration',
      value: `${round(peakG, 2)} g`,
      message: 'Peak G is unusually high for a usable riding metric.',
      suggestion: 'Check whether the chart data includes spikes, impacts, raw sensor units, or unfiltered accelerometer magnitude.',
    });
  }

  if (totalImpulse !== null && totalImpulse <= 0) {
    diagnostics.push({
      code: 'IMPULSE_ZERO_OR_NEGATIVE',
      severity: 'warning',
      area: 'impulse',
      value: totalImpulse,
      message: 'Impulse could not be meaningfully estimated from this trace.',
      suggestion: 'Check acceleration data and total rider+bike mass.',
    });
  }

  if (!physics.timesS.length || !physics.accelerationG.length) {
    diagnostics.push({
      code: 'SERIES_EMPTY',
      severity: 'error',
      area: 'data',
      message: 'No usable time-series data was available for this run.',
      suggestion: 'Check upload parsing and the chart_data field.',
    });
  }

  return diagnostics;
}

export function hasBlockingCalibrationIssue(diagnostics: PerformanceDiagnostic[]): boolean {
  return diagnostics.some(d => d.severity === 'error' && ['speed', 'power', 'calibration'].includes(d.area));
}

export function maxFinite(values: number[] | null | undefined): number | null {
  const finite = (values ?? []).filter(Number.isFinite);
  return finite.length ? Math.max(...finite) : null;
}

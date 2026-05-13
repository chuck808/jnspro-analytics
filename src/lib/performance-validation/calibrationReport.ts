import type { ValidationReport } from './types';

export function getValidationBadge(status: ValidationReport['overallStatus']): string {
  switch (status) {
    case 'pass':
      return 'Systems aligned';
    case 'warn':
      return 'Review differences';
    case 'fail':
      return 'Calibration needed';
    default:
      return 'Awaiting data';
  }
}

export function getMergeRecommendation(report: ValidationReport): string {
  if (report.overallStatus === 'pass') {
    return 'Safe to start merging low-risk shared metrics, while keeping diagnostics visible.';
  }

  if (report.overallStatus === 'warn') {
    return 'Do not merge yet. Compare a few more sessions and confirm differences are acceptable.';
  }

  if (report.overallStatus === 'fail') {
    return 'Do not merge. Keep bridge mode active and fix speed/time/acceleration calibration first.';
  }

  return 'Not enough comparable data. Add existing curve/splits and engine chart series to the validator.';
}

export function formatDelta(value: number | null, unit = ''): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}${unit}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}

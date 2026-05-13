import type { SeriesPoint } from '$lib/performance-engine';
import type { ChartStats } from './types';

export function validSeries(data: SeriesPoint[] | null | undefined): SeriesPoint[] {
  return (data ?? [])
    .filter(p => Number.isFinite(p.timeS) && Number.isFinite(p.value))
    .sort((a, b) => a.timeS - b.timeS);
}

export function getStats(data: SeriesPoint[]): ChartStats | null {
  const series = validSeries(data);
  if (!series.length) return null;
  const values = series.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const final = values[values.length - 1];
  const durationS = series[series.length - 1].timeS - series[0].timeS;
  return { min, max, average, final, durationS };
}

export function formatValue(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

export function buildPath(data: SeriesPoint[], width: number, height: number, padding = 24): string {
  const series = validSeries(data);
  if (series.length < 2) return '';

  const minX = series[0].timeS;
  const maxX = series[series.length - 1].timeS || 1;
  const values = series.map(p => p.value);
  let minY = Math.min(...values);
  let maxY = Math.max(...values);

  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }

  const xScale = (timeS: number) => padding + ((timeS - minX) / Math.max(maxX - minX, 0.001)) * (width - padding * 2);
  const yScale = (value: number) => height - padding - ((value - minY) / Math.max(maxY - minY, 0.001)) * (height - padding * 2);

  return series
    .map((p, index) => `${index === 0 ? 'M' : 'L'} ${xScale(p.timeS).toFixed(2)} ${yScale(p.value).toFixed(2)}`)
    .join(' ');
}

export function normaliseToPrimaryScale(primary: SeriesPoint[], secondary: SeriesPoint[]): SeriesPoint[] {
  const p = validSeries(primary);
  const s = validSeries(secondary);
  if (!p.length || !s.length) return [];

  const pValues = p.map(point => point.value);
  const sValues = s.map(point => point.value);
  const pMin = Math.min(...pValues);
  const pMax = Math.max(...pValues);
  const sMin = Math.min(...sValues);
  const sMax = Math.max(...sValues);

  if (sMin === sMax) return s.map(point => ({ ...point, value: (pMin + pMax) / 2 }));

  return s.map(point => ({
    timeS: point.timeS,
    value: pMin + ((point.value - sMin) / (sMax - sMin)) * (pMax - pMin),
  }));
}

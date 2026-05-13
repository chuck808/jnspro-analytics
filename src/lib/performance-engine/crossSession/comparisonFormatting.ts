/**
 * v8.2 Comparison Formatting
 * 
 * Helps format metric comparisons clearly, especially for lower-is-better metrics
 * to avoid confusing "↑ means worse" situations.
 */

export interface MetricComparisonOptions {
  label: string;
  unit?: string;
  direction: 'higher-is-better' | 'lower-is-better';
  decimals?: number;
}

export interface FormattedComparison {
  fromValue: string;
  toValue: string;
  change: string;
  isImproving: boolean;
  percentChange: number;
  narrative: string;
}

export function formatMetricComparison(
  oldValue: number | null,
  newValue: number | null,
  options: MetricComparisonOptions
): FormattedComparison | null {
  if (oldValue === null || newValue === null) return null;

  const decimals = options.decimals ?? 2;
  const unit = options.unit ?? '';
  
  const rawChange = newValue - oldValue;
  const percentChange = (rawChange / oldValue) * 100;
  
  // Determine if this is an improvement based on direction
  const isImproving = options.direction === 'higher-is-better'
    ? rawChange > 0
    : rawChange < 0;
  
  const absChange = Math.abs(rawChange);
  const fromStr = `${oldValue.toFixed(decimals)}${unit}`;
  const toStr = `${newValue.toFixed(decimals)}${unit}`;
  const changeStr = `${absChange.toFixed(decimals)}${unit}`;
  
  // Build narrative
  const direction = isImproving ? 'better' : 'worse';
  const narrative = `${fromStr} → ${toStr} (${direction} by ${changeStr})`;
  
  return {
    fromValue: fromStr,
    toValue: toStr,
    change: changeStr,
    isImproving,
    percentChange,
    narrative
  };
}

export function formatSpeedComparison(oldKmh: number | null, newKmh: number | null): FormattedComparison | null {
  return formatMetricComparison(oldKmh, newKmh, {
    label: 'Speed',
    unit: ' km/h',
    direction: 'higher-is-better',
    decimals: 1
  });
}

export function formatReactionComparison(oldSec: number | null, newSec: number | null): FormattedComparison | null {
  return formatMetricComparison(oldSec, newSec, {
    label: 'Reaction time',
    unit: 's',
    direction: 'lower-is-better',
    decimals: 3
  });
}

export function formatConsistencyComparison(oldScore: number | null, newScore: number | null): FormattedComparison | null {
  return formatMetricComparison(oldScore, newScore, {
    label: 'Consistency',
    unit: '%',
    direction: 'higher-is-better',
    decimals: 1
  });
}

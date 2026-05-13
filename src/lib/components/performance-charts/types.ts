import type { SeriesPoint } from '$lib/performance-engine';

export interface ChartThreshold {
  label: string;
  value: number;
  tone?: 'good' | 'warn' | 'danger' | 'neutral';
}

export interface ChartMarker {
  label: string;
  timeS: number;
  tone?: 'good' | 'warn' | 'danger' | 'neutral';
}

export interface DisplayChartProps {
  title: string;
  subtitle?: string;
  unit: string;
  data: SeriesPoint[];
  secondaryData?: SeriesPoint[];
  secondaryUnit?: string;
  secondaryLabel?: string;
  markers?: ChartMarker[];
  thresholds?: ChartThreshold[];
  height?: number;
  compact?: boolean;
  showStats?: boolean;
}

export interface ChartStats {
  min: number;
  max: number;
  average: number;
  final: number;
  durationS: number;
}

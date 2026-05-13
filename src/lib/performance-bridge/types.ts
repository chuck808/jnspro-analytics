import type { SessionAnalysis, RunAnalysis, SeriesPoint, DetailLevel } from '../performance-engine';

/**
 * Existing AppGatePro acceleration split shape.
 * Keep this compatible with src/lib/utils/analytics.ts so the current app feature remains the source of truth.
 */
export interface AppAccelerationSplit {
  label: string;
  phase: string;
  timeS: number;
  distanceM: number;
}

export interface AppSpeedCurveLike {
  times: number[];
  speeds: number[];
  accels: number[];
  distances: number[];
}

export interface ExistingAppAnalytics {
  curve?: AppSpeedCurveLike | null;
  splits?: AppAccelerationSplit[] | null;
  quality?: unknown;
  speedProfile?: string | null;
  techniqueScores?: unknown;
  phaseMetrics?: unknown;
  sessionStability?: unknown;
}

export type IntegrationSectionSource = 'current-app' | 'performance-engine' | 'shared';

export interface IntegrationSection {
  id: string;
  title: string;
  source: IntegrationSectionSource;
  visibleFor: DetailLevel[];
  status: 'ready' | 'calibration-warning' | 'missing-data';
  summary?: string;
}

export interface CombinedRunAnalysis {
  selectedRun: RunAnalysis | null;
  engine: SessionAnalysis;
  app: ExistingAppAnalytics;
  sections: IntegrationSection[];
  accelerationSplits: AppAccelerationSplit[];
  chartSeries: {
    acceleration: SeriesPoint[];
    speed: SeriesPoint[];
    distance: SeriesPoint[];
    impulse: SeriesPoint[];
    power: SeriesPoint[];
    jerk: SeriesPoint[];
  };
}

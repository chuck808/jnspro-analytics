import type { SeriesPoint } from '$lib/performance-engine';
import type { ExistingAppAnalytics } from '$lib/performance-bridge';

export type AgreementStatus = 'pass' | 'warn' | 'fail' | 'unknown';

export interface ValidationThresholds {
  passPercent: number;
  warnPercent: number;
  maxPlausibleSpeedKmh: number;
  maxPlausibleDistanceM: number;
  maxPlausiblePeakG: number;
}

export interface MetricComparison {
  key: string;
  label: string;
  existingValue: number | null;
  engineValue: number | null;
  unit: string;
  difference: number | null;
  differencePercent: number | null;
  status: AgreementStatus;
  message: string;
}

export interface SplitComparison {
  targetKmh: number;
  existingTimeS: number | null;
  engineTimeS: number | null;
  existingDistanceM: number | null;
  engineDistanceM: number | null;
  timeDifferenceS: number | null;
  distanceDifferenceM: number | null;
  status: AgreementStatus;
}

export interface ValidationReport {
  overallStatus: AgreementStatus;
  metricComparisons: MetricComparison[];
  splitComparisons: SplitComparison[];
  likelyIssues: string[];
  suggestedChecks: string[];
  shouldTrustSpeed: boolean;
  shouldTrustPower: boolean;
  summary: string;
}

export interface EngineValidationInput {
  existingAppAnalytics?: ExistingAppAnalytics | null;
  engineAnalysis: {
    summary?: {
      peakG?: number;
      peakSpeedKmh?: number;
      peakPowerW?: number;
      impulseNs?: number;
    };
    diagnostics?: {
      status?: AgreementStatus;
      shouldTrustSpeed?: boolean;
      shouldTrustPower?: boolean;
      warnings?: string[];
      errors?: string[];
    };
  };
  chartSeries?: {
    speed?: SeriesPoint[];
    acceleration?: SeriesPoint[];
    distance?: SeriesPoint[];
  };
  thresholds?: Partial<ValidationThresholds>;
}

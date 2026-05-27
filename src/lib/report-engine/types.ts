export type ReportType = 'coach-session' | 'progress' | 'diagnostic' | 'rider-parent';
export type ReportDetailLevel = 'simple' | 'standard' | 'coach' | 'technical';
export type ReportPriority = 'high' | 'medium' | 'low';

export type ReportSectionType =
  | 'executive-summary'
  | 'key-findings'
  | 'session-quality'
  | 'progress-trends'
  | 'technique-analysis'
  | 'data-quality'
  | 'recommendations'
  | 'watch-for'
  | 'charts'
  | 'appendix';

export interface ReportSubject {
  riderName?: string;
  sessionId?: string;
  sessionTitle?: string;
  dateRange?: string;
  sessionCount?: number;
}

export interface ReportSummary {
  headline: string;
  confidence?: 'low' | 'medium' | 'moderate' | 'high';
  body: string[];
}

export interface ReportMetric {
  label: string;
  value: string | number;
  unit?: string;
  rating?: string;
  note?: string;
}

export interface ReportRecommendation {
  id: string;
  priority: ReportPriority;
  title: string;
  body: string;
  watchFor?: string;
}

export interface ReportChart {
  id: string;
  title: string;
  description?: string;
  chartType: 'line' | 'bar' | 'scatter' | 'heatmap' | 'table';
  dataKey: string;
  includeByDefault: boolean;
  data?: Array<{ x: number; y: number; label?: string }>; // Actual chart data
}

export interface ReportAppendix {
  id: string;
  title: string;
  content: string[];
}

export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  priority: ReportPriority;
  content: string[];
  metrics?: ReportMetric[];
  charts?: ReportChart[];
}

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  subtitle?: string;
  generatedAt: string;
  detailLevel: ReportDetailLevel;
  subject: ReportSubject;
  summary: ReportSummary;
  sections: ReportSection[];
  charts: ReportChart[];
  recommendations: ReportRecommendation[];
  appendices?: ReportAppendix[];
}

export interface ReportBuildOptions {
  detailLevel?: ReportDetailLevel;
  includeCharts?: boolean;
  includeDiagnostics?: boolean;
  includeAppendix?: boolean;
  includeRecommendations?: boolean;
}

export interface NarrativeInsight {
  tone: 'positive' | 'warning' | 'neutral';
  title: string;
  body: string;
}

export interface SessionNarrative {
  message: {
    headline: string;
    impact?: string;
    whyThisMatters?: string;
    watchFor?: string;
    isCoachingHeadline?: true;
  };
  insights?: NarrativeInsight[];
  trust?: {
    confidence?: number | string;
    basedOnRuns?: number;
    excludedRuns?: number;
    excludedReasons?: string[];
    cautionMetrics?: string[];
    blockedMetrics?: string[];
  };
  contextNotes?: string[];
  recommendations?: Array<{ id: string; title: string; body: string; priority: 'high' | 'medium' | 'low' }>;
}

export interface ProgressRecommendation {
  priority?: 'high' | 'medium' | 'low';
  title: string;
  body?: string;
  message?: string;
  watchFor?: string;
}

export interface SessionReportData {
  sessionQuality: number | null;
  headline?: string;
  confidence?: number | string;
  repeatability?: {
    overall: number | null;
    cvPercent: number | null;
    label: string | null;
  } | null;
  bestVsAvg?: {
    gapPercent: number | null;
  } | null;
  setLength?: {
    optimal: number | null;
    message?: string | null;
  };
  dropOff?: {
    dropOffRun: number | null;
  };
  phaseAnalysis?: {
    driveEfficiency: number;
    transitionEfficiency: number;
    maintenanceScore: number;
    technicalAssessment?: string;
  } | null;
  impulseAnalysis?: {
    totalImpulseNs: number;
    timeToHalfImpulseS: number;
    frontLoadedScore: number;
    impulseEfficiency: number;
  } | null;
  runSummaries?: Array<{
    runNumber: number;
    reactionMs: number | null;
    maxG: number | null;
    peakSpeedKmh: number | null;
    techniqueOverall: number | null;
    analyticsValid: boolean;
  }>;
  recommendations?: ReportRecommendation[];
}

export interface TechniqueSummaryData {
  overall: number | null;
  reaction: number | null;
  explosiveness: number | null;
  smoothness: number | null;
  efficiency: number | null;
  wheelieRunCount?: number;
  controlledLiftCount?: number;
  excessiveLiftCount?: number;
  lateLiftCount?: number;
  summary?: string | null;
}

export interface DataQualityData {
  label: string | null;
  rating?: string;
  biasCorrection: number | null;
  analyticsValid: boolean;
  blocksPower: boolean;
  blocksSpeed: boolean;
  blocksDistanceConfidence?: boolean;
}

export interface CoachSessionReportInput {
  riderName?: string;
  sessionId: string;
  sessionTitle?: string;
  sessionDate?: string;
  runCount: number;
  excludedRunCount?: number;
  excludedReasons?: string[];
  sessionFocus?: string | null;
  trackSurface?: string | null;
  weatherCondition?: string | null;
  rideFeel?: string | null;
  sessionNotes?: Array<{
    note_type: 'pre' | 'during' | 'post' | 'coach';
    content: string;
    author_role?: string | null;
    created_at?: string;
  }>;
  sessionReport?: SessionReportData | null;
  sessionNarrative?: SessionNarrative | null;
  techniqueSummary?: TechniqueSummaryData | null;
  dataQuality?: DataQualityData | null;
  recommendations?: ReportRecommendation[];
  charts?: ReportChart[];
  riderLevel?: string | null;
  // Goals hit or progressed during this session — surfaces in report context
  goalProgress?: Array<{
    goalId: string;
    metric: string;
    metricLabel: string;
    improvement: string;
    percentToGoal: number;
    isSignificant: boolean;
  }> | null;
}

export interface ProgressReportInput {
  riderName?: string;
  dateRange?: string;
  sessionCount: number;
  personalBests?: {
    bestReactionMs?: number | null;
    bestPeakSpeedKmh?: number | null;
    bestMaxG?: number | null;
  };
  crossSessionReport?: import('$lib/performance-engine/crossSession/types').CrossSessionReport;
  reactionTrendPercent?: number | null;
  speedTrendPercent?: number | null;
  recommendations?: ReportRecommendation[];
  goalContext?: Array<{
    metric: string;
    targetValue: number;
    currentValue: number | null;
    percentToGoal: number | null;
  }> | null;
  charts?: ReportChart[];
}
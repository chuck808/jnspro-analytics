/**
 * Performance Engine v8.0 — Cross-Session Intelligence Types
 */

export interface SessionPerformanceSummary {
	sessionId: string;
	date: string | Date;
	runCount: number;

	// v7.2 session intelligence outputs
	sessionQuality: number | null;
	repeatabilityScore: number | null;
	bestVsAvgGapPercent: number | null;
	dropOffRun: number | null;
	optimalSetLength: number | null;

	// Performance metrics
	bestSpeedKmh: number | null;
	avgSpeedKmh: number | null;
	bestReactionTimeSec: number | null;
	avgReactionTimeSec: number | null;
	peakG: number | null;
	avgPeakG: number | null;

	// Context fields — null when not set by rider.
	// Used by the contextual patterns analyser to segment trends by condition.
	// These are interpretive inputs only — they do not affect the core numeric
	// trend calculations in progressionAnalysis, consistencyTrends, or
	// fatigueProgression.
	weatherCondition: string | null;
	trackSurface: string | null;
	sessionFocus: string | null;
	rideFeel: string | null;
}

export type TrendDirection = 'up' | 'down' | 'stable' | 'unknown';
export type ConfidenceLevel = 'low' | 'moderate' | 'high';
export type OverallTrend = 'improving' | 'stable' | 'declining' | 'mixed' | 'unknown';

export interface TrendResult {
	direction: TrendDirection;
	change: number | null;
	changePercent: number | null;
	recent: number | null;
	historical: number | null;
	improving: boolean;
}

export interface PerformanceProgression {
	speedTrend: TrendResult;
	reactionTrend: TrendResult;
	peakGTrend: TrendResult;
}

export interface ConsistencyTrends {
	repeatabilityTrend: TrendResult;
	bestVsAverageGapTrend: TrendResult;
}

export interface FatigueProgression {
	dropOffTrend: TrendResult;
	optimalSetLengthTrend: TrendResult;
}

export interface CrossSessionReport {
	status: 'insufficient-data' | 'ready';
	sessionCount: number;
	lookbackSessions: number;
	confidence: ConfidenceLevel;
	overallTrend: OverallTrend;

	performance: PerformanceProgression;
	consistency: ConsistencyTrends;
	fatigue: FatigueProgression;

	// Condition-segmented patterns — null when insufficient context data
	contextualPatterns: ContextualPatterns | null;

	warnings: string[];
	recommendations: string[];
	headline: string;
}

export interface CrossSessionOptions {
	minSessions?: number;
	lookbackSessions?: number;
}

// ── Contextual pattern analysis ───────────────────────────────────────────────
// Condition-segmented performance patterns derived from sessions with context
// fields set. All findings require MIN_CONDITION_SESSIONS sessions in a
// condition group before surfacing — prevents single-session false positives.

export interface ConditionSegment {
	condition: string; // e.g. 'wet', 'dry-concrete', 'cold'
	sessionCount: number;
	bestReactionMs: number | null;
	avgReactionMs: number | null;
	avgConsistencyCV: number | null;
	avgSessionQuality: number | null;
}

export interface ContextualPattern {
	variable: 'trackSurface' | 'weatherCondition' | 'sessionFocus' | 'rideFeel';
	metric: 'reactionTime' | 'consistency' | 'sessionQuality';
	finding: string; // Human-readable pattern description
	direction: 'better' | 'worse' | 'neutral';
	bestCondition: string | null;
	worstCondition: string | null;
	differencePercent: number | null;
	sessionCount: number; // Total sessions used for this pattern
	confidence: 'low' | 'moderate' | 'high';
	// Structured for CorrelationHint consumption in the narrative engine
	correlationHint: {
		variable: string;
		value: string;
		metric: string;
		direction: 'better' | 'worse';
		strength: 'strong' | 'moderate' | 'weak';
		sessionCount: number;
	} | null;
}

export interface ContextualPatterns {
	hasEnoughData: boolean;
	patterns: ContextualPattern[];
	// PB-by-condition — used by achievement detector for condition-aware PB claims
	pbsByCondition: Record<
		string,
		{
			surface: string | null;
			bestReactionMs: number | null;
			sessionCount: number;
		}
	>;
}

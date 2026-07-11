export type DetailLevel = 'grom' | 'rider' | 'elite' | 'coach';

export interface RiderContext {
	riderLevel?: string | null;
	riderWeightKg?: number | null;
	bikeWeightKg?: number | null;
	crankLengthMm?: number | null;
	// Session context — affects interpretation, not physics calculations
	sessionFocus?:
		| 'reaction-time'
		| 'explosiveness'
		| 'speed-carry'
		| 'technique'
		| 'endurance'
		| 'consistency'
		| 'recovery'
		| 'testing'
		| null;
	rideFeel?: 'off' | 'solid' | 'good' | 'dialled' | 'peak' | null;
	weatherCondition?: string | null;
	trackSurface?: string | null;
}

export interface GateRunLike {
	reaction_time_ms?: number | null;
	max_g?: number | null;
	peak_speed_ms?: number | null;
	avg_speed_ms_calc?: number | null;
	speed_ms?: number | null;
	time_to_peak_speed_ms?: number | null;
	analytics_valid?: boolean | null;
	bias_correction_ms2?: number | null;
}

export interface RunLike {
	id?: string | number;
	run_number?: number | null;
	elapsed_time_ms?: number | null;
	chart_data?: number[] | null;
	gate_runs?: GateRunLike | null;
	[key: string]: unknown;
}

export interface SessionLike {
	id?: string | number;
	session_type?: string | null;
	created_at?: string | null;
	runs?: RunLike[];
	[key: string]: unknown;
}

export interface SeriesPoint {
	timeS: number;
	value: number;
}

export interface PerformanceSummary {
	runCount: number;
	validRunCount: number;
	bestReactionMs: number | null;
	averageReactionMs: number | null;
	peakG: number | null;
	averageMaxG: number | null;
	peakSpeedKmh: number | null;
	consistencyScore: number | null;
	consistencyLabel: string | null;
	bestRunNumber: number | null;
}

export interface PhysicsAnalysis {
	timesS: number[];
	accelerationG: number[];
	/**
	 * Speed curve integrated from IMU chart_data, shape-only.
	 * CRITICAL_FINDING.md diagnosed this integration as unreliable for absolute
	 * magnitude — firmware only reports peak/avg/end speed as scalars, not a
	 * full time series, so this curve is the sole source for splits/distances/
	 * technique/power/impulse. Treat as estimated; prefer measuredPeakSpeedKmh /
	 * measuredAvgSpeedKmh / measuredEndSpeedKmh for any single-number display.
	 */
	speedKmh: number[];
	speedCurveEstimated: true;
	/** Firmware-measured ground truth (gate_runs.peak_speed_ms), when available. */
	measuredPeakSpeedKmh: number | null;
	/** Firmware-measured ground truth (gate_runs.avg_speed_ms_calc), when available. */
	measuredAvgSpeedKmh: number | null;
	/** Firmware-measured ground truth (gate_runs.speed_ms), when available. */
	measuredEndSpeedKmh: number | null;
	distanceM: number[];
	impulseSeries?: SeriesPoint[];
	powerSeries?: SeriesPoint[];
	jerkSeries?: SeriesPoint[];
	jerk?: {
		meanAbsolute: number;
		smoothnessScore: number;
		insight: string;
	} | null;
	impulse?: {
		totalImpulseNs: number;
		timeToHalfImpulseS: number;
		timeToNinetyPctImpulseS: number;
		frontLoadedScore: number;
		impulseEfficiency: number;
	} | null;
	power?: {
		peakW: number;
		averageW: number;
		estimated: true;
	} | null;
	speedSplits?: Array<{
		label: string;
		phase: string;
		timeS: number;
		distanceM: number;
	}>;
	speedProfile?: string;
	dataQuality?: {
		rating: string;
		label: string;
		color: string;
		badge: string;
		description: string;
		bias?: number;
	} | null;
}

export interface TechniqueAnalysis {
	overall: number | null;
	reaction: number | null;
	explosiveness: number | null;
	smoothness: number | null;
	efficiency: number | null;
	phaseAssessment?: string | null;
}

export interface WeaknessAnalysis {
	area: string;
	score?: number | null;
	advice: string[];
}

export interface Recommendation {
	priority: 'high' | 'medium' | 'low';
	title: string;
	message: string;
	metric?: string;
}

export interface RunAnalysis {
	runNumber: number | null;
	elapsedMs: number;
	reactionMs: number | null;
	maxG: number | null;
	analyticsValid: boolean;
	physics: PhysicsAnalysis | null;
	technique: TechniqueAnalysis | null;
	diagnostics?: import('./diagnostics').PerformanceDiagnostic[];
}

export interface SessionAnalysis {
	summary: PerformanceSummary;
	selectedRun: RunAnalysis | null;
	runs: RunAnalysis[];
	weaknesses: WeaknessAnalysis[];
	recommendations: Recommendation[];
	profileComplete: boolean;
	diagnostics: import('./diagnostics').PerformanceDiagnostic[];
	hasCalibrationWarning: boolean;
	intelligence?: import('./sessionIntelligence').SessionIntelligenceReport | null;
	context: RiderContext;
	units: {
		acceleration: 'g';
		speed: 'km/h';
		distance: 'm';
		power: 'W';
		impulse: 'N·s';
	};
}

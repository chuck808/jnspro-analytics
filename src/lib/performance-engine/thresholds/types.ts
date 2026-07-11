export type RiderLevel = 'grom' | 'rider' | 'elite' | 'coach';
export type ThresholdConfidence = 'starter' | 'field-tested' | 'validated';

export interface MetricThreshold {
	excellent: number;
	good: number;
	caution: number;
	poor: number;
	unit: string;
	direction: 'higher-is-better' | 'lower-is-better';
	confidence: ThresholdConfidence;
	notes: string;
}

export interface BMXThresholdProfile {
	profileName: string;
	level: RiderLevel;
	metrics: {
		reactionTimeMs: MetricThreshold;
		peakSpeedKmh: MetricThreshold;
		peakG: MetricThreshold;
		repeatabilityScore: MetricThreshold;
		bestVsAvgGapPercent: MetricThreshold;
		optimalSetLength: MetricThreshold;
		dropOffRun: MetricThreshold;
		smoothnessScore: MetricThreshold;
	};
}

export interface ThresholdRating {
	metric: string;
	value: number | null | undefined;
	rating: 'excellent' | 'good' | 'caution' | 'poor' | 'unknown';
	message: string;
	threshold: MetricThreshold;
}

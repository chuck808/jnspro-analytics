export type FeedbackResponse = 'useful' | 'not-useful' | 'confusing';

export interface InsightFeedbackRecord {
	insightType: string;
	content: string;
	response: FeedbackResponse;
	detailLevel: 'grom' | 'rider' | 'elite' | 'coach';
	createdAt: string;
}

export interface FeedbackSummary {
	insightType: string;
	total: number;
	useful: number;
	notUseful: number;
	confusing: number;
	usefulnessScore: number; // %
}

export interface FeedbackAnalyticsReport {
	overall: FeedbackSummary;
	byInsightType: FeedbackSummary[];
	byDetailLevel: Record<string, FeedbackSummary>;
}

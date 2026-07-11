import type { InsightFeedbackRecord, FeedbackAnalyticsReport, FeedbackSummary } from './types';

export function analyseFeedback(records: InsightFeedbackRecord[]): FeedbackAnalyticsReport {
	const overall = buildSummary('overall', records);

	const byInsightType = groupAndSummarise(records, (r) => r.insightType);

	const byDetailLevelEntries = group(records, (r) => r.detailLevel);
	const byDetailLevel: Record<string, FeedbackSummary> = {};
	for (const key in byDetailLevelEntries) {
		byDetailLevel[key] = buildSummary(key, byDetailLevelEntries[key]);
	}

	return {
		overall,
		byInsightType,
		byDetailLevel
	};
}

function groupAndSummarise(
	records: InsightFeedbackRecord[],
	keyFn: (r: InsightFeedbackRecord) => string
): FeedbackSummary[] {
	const grouped = group(records, keyFn);
	return Object.entries(grouped).map(([key, recs]) => buildSummary(key, recs));
}

function group(records: InsightFeedbackRecord[], keyFn: (r: InsightFeedbackRecord) => string) {
	const result: Record<string, InsightFeedbackRecord[]> = {};
	for (const r of records) {
		const key = keyFn(r);
		if (!result[key]) result[key] = [];
		result[key].push(r);
	}
	return result;
}

function buildSummary(label: string, records: InsightFeedbackRecord[]): FeedbackSummary {
	const total = records.length;
	const useful = records.filter((r) => r.response === 'useful').length;
	const notUseful = records.filter((r) => r.response === 'not-useful').length;
	const confusing = records.filter((r) => r.response === 'confusing').length;

	const usefulnessScore = total ? (useful / total) * 100 : 0;

	return {
		insightType: label,
		total,
		useful,
		notUseful,
		confusing,
		usefulnessScore
	};
}

import type { CorrelationInsight } from '$lib/analytics/correlationAnalysis';

/**
 * Prepare legacy Patterns insights for display while allowing a higher-trust
 * Progress surface to suppress the exact insight it already presents.
 * Suppression is identity-based so unrelated insights remain visible.
 */
export function buildVisiblePatternInsights(
	insights: CorrelationInsight[],
	suppressedInsightIds: string[] = [],
	limit = 6
): CorrelationInsight[] {
	const suppressed = new Set(suppressedInsightIds);

	return [...insights]
		.filter((insight) => !suppressed.has(insight.id))
		.sort((a, b) => Math.abs(b.correlation.correlation) - Math.abs(a.correlation.correlation))
		.slice(0, limit);
}

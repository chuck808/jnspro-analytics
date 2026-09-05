import type { CorrelationInsight } from '$lib/analytics/correlationAnalysis';

export type ProgressPatternKind = 'linear-association' | 'categorical-difference';

export interface ProgressPatternInsight {
	id: string;
	title: string;
	description: string;
	kind: ProgressPatternKind;
	sampleSize: number;
	strength: CorrelationInsight['correlation']['strength'];
	significant: boolean;
	correlation: number | null;
	direction: CorrelationInsight['correlation']['direction'];
}

function toProgressPattern(insight: CorrelationInsight): ProgressPatternInsight {
	const categorical = insight.correlation.direction === 'none';
	return {
		id: insight.id,
		title: insight.title,
		description: insight.description,
		kind: categorical ? 'categorical-difference' : 'linear-association',
		sampleSize: insight.correlation.sampleSize,
		strength: insight.correlation.strength,
		significant: insight.correlation.significant,
		correlation: categorical ? null : insight.correlation.correlation,
		direction: insight.correlation.direction
	};
}

/**
 * Prepare legacy correlation output for Progress display while allowing a
 * higher-trust Progress surface to suppress the exact insight it already owns.
 *
 * Multi-variable synthesis is excluded because it contains causal/coaching
 * narrative that has not crossed the Progress evidence boundary. Categorical
 * results are preserved as differences, but their legacy correlation=0
 * placeholder is never exposed as Pearson r.
 */
export function buildVisiblePatternInsights(
	insights: CorrelationInsight[],
	suppressedInsightIds: string[] = [],
	limit = 6
): ProgressPatternInsight[] {
	const suppressed = new Set(suppressedInsightIds);

	return insights
		.filter((insight) => !suppressed.has(insight.id))
		.filter((insight) => !insight.id.startsWith('insight-multi-'))
		.map(toProgressPattern)
		.sort((a, b) => {
			if (b.sampleSize !== a.sampleSize) return b.sampleSize - a.sampleSize;
			return Math.abs(b.correlation ?? 0) - Math.abs(a.correlation ?? 0);
		})
		.slice(0, limit);
}

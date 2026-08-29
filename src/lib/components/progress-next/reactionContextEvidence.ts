import type { CorrelationInsight } from '$lib/analytics/correlationAnalysis';

export type ReactionContextEvidenceState = 'absent' | 'no-pattern' | 'contextual-finding';

export interface ReactionContextEvidenceModel {
	state: ReactionContextEvidenceState;
	qualifyingInsightCount: number;
	selected: null | {
		id: string;
		title: string;
		statement: string;
		sampleSize: number;
		strength: CorrelationInsight['correlation']['strength'];
		correlation: number;
		variable: string;
	};
	presentation: {
		label: 'Context building' | 'No meaningful pattern' | 'Contextual finding';
		statement: string;
	};
}

function isReactionInsight(insight: CorrelationInsight): boolean {
	return (
		!insight.id.startsWith('insight-multi-') &&
		insight.correlation.variable2.toLowerCase().includes('reaction')
	);
}

function safeVariableLabel(insight: CorrelationInsight): string {
	const label = insight.correlation.variable1.trim();
	return label || 'Recorded context';
}

function contextualStatement(insight: CorrelationInsight): string {
	const sampleSize = insight.correlation.sampleSize;
	const variable = safeVariableLabel(insight);
	const magnitude = Math.abs(insight.correlation.correlation).toFixed(2);

	if (insight.correlation.direction === 'none') {
		return `${variable} has shown a qualifying difference alongside reaction across ${sampleSize} supported sessions. This is an association, not a cause.`;
	}

	const direction = insight.correlation.direction === 'negative' ? 'negative' : 'positive';
	return `${variable} has shown a ${direction} association with reaction across ${sampleSize} supported sessions (r=${magnitude}). This is an association, not a cause.`;
}

/**
 * Adapt legacy correlation output into the stricter Reaction Progress claim boundary.
 *
 * The adapter intentionally ignores legacy recommendation/example prose and
 * multi-variable synthesis. It carries through only qualifying Reaction
 * associations plus their sample-size and strength provenance, and it does not
 * re-run correlation calculations in Svelte.
 */
export function buildReactionContextEvidence(
	insights: CorrelationInsight[],
	supportedReactionSessionCount: number,
	totalSessionCount: number
): ReactionContextEvidenceModel {
	if (supportedReactionSessionCount < 5) {
		return {
			state: 'absent',
			qualifyingInsightCount: 0,
			selected: null,
			presentation: {
				label: 'Context building',
				statement:
					'Recorded context needs at least 5 supported Reaction sessions before a contextual finding can be shown.'
			}
		};
	}

	if (totalSessionCount < 10) {
		return {
			state: 'absent',
			qualifyingInsightCount: 0,
			selected: null,
			presentation: {
				label: 'Context building',
				statement:
					'The current context analysis begins after 10 eligible sessions. No contextual claim is made before that analysis runs.'
			}
		};
	}

	const qualifying = insights
		.filter(isReactionInsight)
		.filter((insight) => insight.correlation.sampleSize >= 5)
		.filter((insight) => insight.correlation.significant)
		.sort((a, b) => {
			if (b.correlation.sampleSize !== a.correlation.sampleSize) {
				return b.correlation.sampleSize - a.correlation.sampleSize;
			}
			return Math.abs(b.correlation.correlation) - Math.abs(a.correlation.correlation);
		});

	const selected = qualifying[0] ?? null;
	if (!selected) {
		return {
			state: 'no-pattern',
			qualifyingInsightCount: 0,
			selected: null,
			presentation: {
				label: 'No meaningful pattern',
				statement:
					'No qualifying recorded context currently shows a meaningful association with Reaction.'
			}
		};
	}

	const statement = contextualStatement(selected);
	return {
		state: 'contextual-finding',
		qualifyingInsightCount: qualifying.length,
		selected: {
			id: selected.id,
			title: selected.title,
			statement,
			sampleSize: selected.correlation.sampleSize,
			strength: selected.correlation.strength,
			correlation: selected.correlation.correlation,
			variable: safeVariableLabel(selected)
		},
		presentation: {
			label: 'Contextual finding',
			statement
		}
	};
}

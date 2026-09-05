import type { CorrelationInsight } from '$lib/analytics/correlationAnalysis';

export type PowerContextEvidenceState = 'absent' | 'no-pattern' | 'contextual-finding';

export interface PowerContextEvidenceModel {
	state: PowerContextEvidenceState;
	qualifyingInsightCount: number;
	selected: null | {
		id: string;
		title: string;
		statement: string;
		sampleSize: number;
		strength: CorrelationInsight['correlation']['strength'];
		correlation: number;
		direction: CorrelationInsight['correlation']['direction'];
		variable: string;
	};
	presentation: {
		label: 'Context building' | 'No meaningful pattern' | 'Contextual finding';
		statement: string;
	};
}

export function isPowerInsight(insight: CorrelationInsight): boolean {
	if (insight.id.startsWith('insight-multi-')) return false;
	return insight.correlation.variable2.trim().toLowerCase().includes('power');
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
		return `${variable} has shown a qualifying difference alongside power across ${sampleSize} supported sessions. This is an association, not a cause.`;
	}

	const direction = insight.correlation.direction === 'negative' ? 'negative' : 'positive';
	return `${variable} has shown a ${direction} association with power across ${sampleSize} supported sessions (r=${magnitude}). This is an association, not a cause.`;
}

/**
 * Adapt legacy correlation output into the stricter Power Progress claim boundary.
 *
 * The correlation engine does not currently compute anything against real
 * physics power (confirmed by inspection of correlationAnalysis.ts — "power"
 * only appears in unrelated prose about peak G-force). This adapter is still
 * written to genuinely match a power-labeled insight if one is ever added; it
 * will honestly stay no-pattern until then, the same honest posture used
 * elsewhere in this pattern for any metric whose contextual evidence has not
 * matured. It does not re-run correlation calculations in Svelte.
 */
export function buildPowerContextEvidence(
	insights: CorrelationInsight[],
	supportedPowerSessionCount: number,
	totalSessionCount: number
): PowerContextEvidenceModel {
	if (supportedPowerSessionCount < 5) {
		return {
			state: 'absent',
			qualifyingInsightCount: 0,
			selected: null,
			presentation: {
				label: 'Context building',
				statement:
					'Recorded context needs at least 5 supported Power sessions before a contextual finding can be shown.'
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
		.filter(isPowerInsight)
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
				statement: 'No qualifying recorded context currently shows a meaningful association with Power.'
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
			direction: selected.correlation.direction,
			variable: safeVariableLabel(selected)
		},
		presentation: {
			label: 'Contextual finding',
			statement
		}
	};
}

import { describe, expect, it } from 'vitest';
import type { CorrelationInsight, CorrelationResult } from '$lib/analytics/correlationAnalysis';
import { buildVisiblePatternInsights } from './progressPatternInsights';

type InsightOverrides = Omit<Partial<CorrelationInsight>, 'correlation'> & {
	correlation?: Partial<CorrelationResult>;
};

function makeInsight(id: string, correlation: number, overrides: InsightOverrides = {}): CorrelationInsight {
	return {
		id,
		title: id,
		description: `${id} description`,
		actionable: false,
		priority: 'low',
		...overrides,
		correlation: {
			variable1: 'Context',
			variable2: 'Reaction Time',
			correlation,
			pValue: 0.01,
			sampleSize: 12,
			significant: true,
			strength: 'moderate',
			direction: correlation < 0 ? 'negative' : 'positive',
			...overrides.correlation
		}
	};
}

describe('buildVisiblePatternInsights', () => {
	it('suppresses only the exact insight already represented by a higher-trust surface', () => {
		const selectedReaction = makeInsight('reaction-time-of-day', -0.8);
		const otherReaction = makeInsight('reaction-temperature', -0.6);
		const trackSurfaceConsistency = makeInsight('track-surface-consistency', 0.7, {
			correlation: { variable1: 'Track Surface', variable2: 'Consistency' }
		});

		const visible = buildVisiblePatternInsights(
			[selectedReaction, otherReaction, trackSurfaceConsistency],
			[selectedReaction.id]
		);

		expect(visible.map((insight) => insight.id)).toEqual([
			trackSurfaceConsistency.id,
			otherReaction.id
		]);
	});

	it('keeps correlation-strength ordering after suppression', () => {
		const visible = buildVisiblePatternInsights(
			[makeInsight('weak', 0.2), makeInsight('strong', -0.9), makeInsight('mid', 0.5)],
			['strong']
		);

		expect(visible.map((insight) => insight.id)).toEqual(['mid', 'weak']);
	});
});

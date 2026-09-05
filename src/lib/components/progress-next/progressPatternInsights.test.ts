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
		const trackSurfaceConsistency = makeInsight('track-surface-consistency', 0, {
			correlation: {
				variable1: 'Track Surface',
				variable2: 'Consistency',
				direction: 'none',
				sampleSize: 18
			}
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

	it('uses supported sample size before linear magnitude when ordering visible evidence', () => {
		const visible = buildVisiblePatternInsights([
			makeInsight('small-strong', -0.9, { correlation: { sampleSize: 8 } }),
			makeInsight('large-mid', 0.5, { correlation: { sampleSize: 15 } }),
			makeInsight('large-weak', 0.2, { correlation: { sampleSize: 15 } })
		]);

		expect(visible.map((insight) => insight.id)).toEqual(['large-mid', 'large-weak', 'small-strong']);
	});

	it('keeps categorical differences without exposing their placeholder zero as Pearson r', () => {
		const [categorical] = buildVisiblePatternInsights([
			makeInsight('track-surface-consistency', 0, {
				correlation: {
					variable1: 'Track Surface',
					variable2: 'Consistency',
					direction: 'none',
					sampleSize: 14
				}
			})
		]);

		expect(categorical).toMatchObject({
			kind: 'categorical-difference',
			correlation: null,
			direction: 'none',
			sampleSize: 14
		});
	});

	it('excludes unvalidated multi-variable synthesis and recommendation prose', () => {
		const visible = buildVisiblePatternInsights([
			makeInsight('insight-multi-4', 0.8, { description: '**Recommendation:** change training.' }),
			makeInsight('insight-5', 0.4)
		]);

		expect(visible.map((insight) => insight.id)).toEqual(['insight-5']);
	});
});

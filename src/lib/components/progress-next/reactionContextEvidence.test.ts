import { describe, expect, it } from 'vitest';
import type { CorrelationInsight, CorrelationResult } from '$lib/analytics/correlationAnalysis';
import { buildReactionContextEvidence } from './reactionContextEvidence';

type InsightOverrides = Omit<Partial<CorrelationInsight>, 'correlation'> & {
	correlation?: Partial<CorrelationResult>;
};

function makeInsight(overrides: InsightOverrides = {}): CorrelationInsight {
	return {
		id: 'reaction-context-1',
		title: 'Temperature appears associated with reaction time',
		description: 'Legacy description that should not be reused directly.',
		actionable: true,
		priority: 'medium',
		example: 'Legacy recommendation that should not surface here.',
		...overrides,
		correlation: {
			variable1: 'Temperature',
			variable2: 'Reaction Time',
			correlation: -0.56,
			pValue: 0.02,
			sampleSize: 8,
			significant: true,
			strength: 'moderate',
			direction: 'negative',
			...overrides.correlation
		}
	};
}

describe('buildReactionContextEvidence', () => {
	it('withholds contextual claims below the five-supported-Reaction floor', () => {
		const model = buildReactionContextEvidence([makeInsight()], 4, 12);

		expect(model.state).toBe('absent');
		expect(model.selected).toBeNull();
		expect(model.presentation.label).toBe('Context building');
		expect(model.presentation.statement).toContain('at least 5 supported Reaction sessions');
	});

	it('keeps context building until the upstream context analysis is eligible to run', () => {
		const model = buildReactionContextEvidence([], 7, 7);

		expect(model.state).toBe('absent');
		expect(model.selected).toBeNull();
		expect(model.presentation.label).toBe('Context building');
		expect(model.presentation.statement).toContain('after 10 eligible sessions');
	});

	it('returns a first-class no-pattern state after context analysis is eligible but has no qualifying finding', () => {
		const model = buildReactionContextEvidence([], 7, 10);

		expect(model.state).toBe('no-pattern');
		expect(model.selected).toBeNull();
		expect(model.presentation.label).toBe('No meaningful pattern');
	});

	it('ignores non-Reaction correlations even when they are statistically significant', () => {
		const model = buildReactionContextEvidence(
			[
				makeInsight({
					correlation: {
						variable1: 'Temperature',
						variable2: 'Peak G-Force'
					}
				})
			],
			12,
			12
		);

		expect(model.state).toBe('no-pattern');
	});

	it('ignores multi-variable legacy synthesis even when its structured correlation is Reaction-shaped', () => {
		const model = buildReactionContextEvidence(
			[makeInsight({ id: 'insight-multi-5' })],
			12,
			12
		);

		expect(model.state).toBe('no-pattern');
	});

	it('ignores a Reaction association that lacks five paired observations', () => {
		const model = buildReactionContextEvidence(
			[makeInsight({ correlation: { sampleSize: 4 } })],
			12,
			12
		);

		expect(model.state).toBe('no-pattern');
	});

	it('ignores a non-significant Reaction association', () => {
		const model = buildReactionContextEvidence(
			[makeInsight({ correlation: { significant: false, pValue: 0.3 } })],
			12,
			12
		);

		expect(model.state).toBe('no-pattern');
	});

	it('surfaces qualifying Reaction context using non-causal adapter language', () => {
		const model = buildReactionContextEvidence([makeInsight()], 7, 12);

		expect(model.state).toBe('contextual-finding');
		expect(model.selected?.sampleSize).toBe(8);
		expect(model.selected?.strength).toBe('moderate');
		expect(model.presentation.statement).toContain('association with reaction');
		expect(model.presentation.statement).toContain('8 supported sessions');
		expect(model.presentation.statement).toContain('not a cause');
		expect(model.presentation.statement).not.toContain('Consider');
		expect(model.presentation.statement).not.toContain('Peak performance');
	});

	it('prefers the qualifying Reaction association with broader paired coverage', () => {
		const model = buildReactionContextEvidence(
			[
				makeInsight({
					id: 'smaller',
					correlation: { sampleSize: 6, correlation: -0.82, strength: 'very strong' }
				}),
				makeInsight({
					id: 'broader',
					correlation: { sampleSize: 10, correlation: -0.45, strength: 'moderate' }
				})
			],
			12,
			12
		);

		expect(model.selected?.id).toBe('broader');
		expect(model.qualifyingInsightCount).toBe(2);
	});
});

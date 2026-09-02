import { describe, expect, it } from 'vitest';
import type { CorrelationInsight, CorrelationResult } from '$lib/analytics/correlationAnalysis';
import { buildPowerContextEvidence, isPowerInsight } from './powerContextEvidence';

type InsightOverrides = Omit<Partial<CorrelationInsight>, 'correlation'> & {
	correlation?: Partial<CorrelationResult>;
};

function makeInsight(overrides: InsightOverrides = {}): CorrelationInsight {
	return {
		id: 'power-context-1',
		title: 'Temperature appears associated with power output',
		description: 'Legacy description that should not be reused directly.',
		actionable: true,
		priority: 'medium',
		example: 'Legacy recommendation that should not surface here.',
		...overrides,
		correlation: {
			variable1: 'Temperature',
			variable2: 'Power Output',
			correlation: 0.48,
			pValue: 0.03,
			sampleSize: 8,
			significant: true,
			strength: 'moderate',
			direction: 'positive',
			...overrides.correlation
		}
	};
}

describe('isPowerInsight', () => {
	it('matches any correlation naming power as its second variable, case-insensitively', () => {
		expect(isPowerInsight(makeInsight({ correlation: { variable2: 'Power Output' } }))).toBe(true);
		expect(isPowerInsight(makeInsight({ correlation: { variable2: 'average power' } }))).toBe(true);
		expect(isPowerInsight(makeInsight({ correlation: { variable2: 'Reaction Time' } }))).toBe(false);
	});

	it('ignores multi-variable legacy synthesis even when power-shaped', () => {
		expect(
			isPowerInsight(makeInsight({ id: 'insight-multi-5', correlation: { variable2: 'Power Output' } }))
		).toBe(false);
	});
});

describe('buildPowerContextEvidence', () => {
	it('withholds contextual claims below the five-supported-Power floor', () => {
		const model = buildPowerContextEvidence([makeInsight()], 4, 12);

		expect(model.state).toBe('absent');
		expect(model.selected).toBeNull();
		expect(model.presentation.label).toBe('Context building');
		expect(model.presentation.statement).toContain('at least 5 supported Power sessions');
	});

	it('keeps context building until the upstream context analysis is eligible to run', () => {
		const model = buildPowerContextEvidence([], 7, 7);

		expect(model.state).toBe('absent');
		expect(model.selected).toBeNull();
		expect(model.presentation.statement).toContain('after 10 eligible sessions');
	});

	it('returns a first-class no-pattern state when context has run but nothing power-shaped qualifies', () => {
		const model = buildPowerContextEvidence([], 7, 10);

		expect(model.state).toBe('no-pattern');
		expect(model.selected).toBeNull();
		expect(model.presentation.label).toBe('No meaningful pattern');
	});

	it('ignores non-power correlations even when they are statistically significant', () => {
		const model = buildPowerContextEvidence(
			[makeInsight({ correlation: { variable1: 'Temperature', variable2: 'Reaction Time' } })],
			12,
			12
		);

		expect(model.state).toBe('no-pattern');
	});

	it('ignores a power association that lacks five paired observations', () => {
		const model = buildPowerContextEvidence([makeInsight({ correlation: { sampleSize: 4 } })], 12, 12);

		expect(model.state).toBe('no-pattern');
	});

	it('ignores a non-significant power association', () => {
		const model = buildPowerContextEvidence(
			[makeInsight({ correlation: { significant: false, pValue: 0.3 } })],
			12,
			12
		);

		expect(model.state).toBe('no-pattern');
	});

	it('surfaces qualifying power context using non-causal adapter language', () => {
		const model = buildPowerContextEvidence([makeInsight()], 7, 12);

		expect(model.state).toBe('contextual-finding');
		expect(model.selected?.sampleSize).toBe(8);
		expect(model.selected?.strength).toBe('moderate');
		expect(model.presentation.statement).toContain('association with power');
		expect(model.presentation.statement).toContain('8 supported sessions');
		expect(model.presentation.statement).toContain('not a cause');
	});

	it('prefers the qualifying power association with broader paired coverage', () => {
		const model = buildPowerContextEvidence(
			[
				makeInsight({ id: 'smaller', correlation: { sampleSize: 6, correlation: 0.82, strength: 'very strong' } }),
				makeInsight({ id: 'broader', correlation: { sampleSize: 10, correlation: 0.45, strength: 'moderate' } })
			],
			12,
			12
		);

		expect(model.selected?.id).toBe('broader');
		expect(model.qualifyingInsightCount).toBe(2);
	});
});

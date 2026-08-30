import { describe, expect, it } from 'vitest';
import type { TechniqueScoreBreakdown } from '$lib/performance-engine/techniqueScoring';
import { buildRiderDevelopmentEvidence } from './riderDevelopmentEvidence';

function scores(
	overrides: Partial<TechniqueScoreBreakdown> = {}
): TechniqueScoreBreakdown {
	return {
		launchQuality: null,
		explosiveness: null,
		impulseTiming: null,
		speedCarry: null,
		smoothness: null,
		repeatability: null,
		overall: null,
		labels: {
			launchQuality: 'unknown',
			explosiveness: 'unknown',
			impulseTiming: 'unknown',
			speedCarry: 'unknown',
			smoothness: 'unknown',
			repeatability: 'unknown',
			overall: 'unknown'
		},
		...overrides
	};
}

function point(id: string, score: TechniqueScoreBreakdown) {
	return {
		sessionId: id,
		timestamp: `2026-08-${id.padStart(2, '0')}T10:00:00Z`,
		insightPack: { scores: score }
	};
}

describe('buildRiderDevelopmentEvidence', () => {
	it('keeps sessions with no finite dimension scores outside the supported count', () => {
		const evidence = buildRiderDevelopmentEvidence([
			point('1', scores()),
			point('2', scores({ launchQuality: Number.NaN }))
		]);

		expect(evidence.state).toBe('absent');
		expect(evidence.supportedSessionCount).toBe(0);
		expect(evidence.dimensions).toEqual([]);
	});

	it('treats one analysed score as measurement, not development direction', () => {
		const score = scores({ launchQuality: 81 });
		score.labels.launchQuality = 'good';
		const evidence = buildRiderDevelopmentEvidence([point('1', score)]);

		expect(evidence.state).toBe('measured');
		expect(evidence.supportedSessionCount).toBe(1);
		expect(evidence.dimensions[0]).toMatchObject({
			key: 'launchQuality',
			current: 81,
			currentLabel: 'good'
		});
		expect(evidence.presentation.statement).toContain('More supported observations');
	});

	it('preserves sparse per-dimension history without null-to-zero coercion', () => {
		const first = scores({ launchQuality: 62 });
		first.labels.launchQuality = 'developing';
		const second = scores({ speedCarry: 78 });
		second.labels.speedCarry = 'good';
		const third = scores({ launchQuality: 70, speedCarry: 82 });
		third.labels.launchQuality = 'good';
		third.labels.speedCarry = 'excellent';

		const evidence = buildRiderDevelopmentEvidence([
			point('1', first),
			point('2', second),
			point('3', third)
		]);

		expect(evidence.state).toBe('observed-history');
		expect(evidence.supportedSessionCount).toBe(3);
		expect(evidence.dimensions.find((item) => item.key === 'launchQuality')?.history).toEqual([
			{ sessionId: '1', timestamp: '2026-08-01T10:00:00Z', value: 62 },
			{ sessionId: '3', timestamp: '2026-08-03T10:00:00Z', value: 70 }
		]);
		expect(evidence.dimensions.find((item) => item.key === 'speedCarry')?.history).toHaveLength(2);
	});

	it('does not manufacture strength or focus semantics from score ordering', () => {
		const first = scores({ launchQuality: 40, explosiveness: 95 });
		const second = scores({ launchQuality: 95, explosiveness: 40 });
		const evidence = buildRiderDevelopmentEvidence([point('1', first), point('2', second)]);

		expect(evidence.state).toBe('observed-history');
		expect(evidence.presentation.statement).toContain('No cross-session trend or coaching claim');
		expect(Object.keys(evidence)).not.toContain('strongest');
		expect(Object.keys(evidence)).not.toContain('focus');
		expect(Object.keys(evidence)).not.toContain('finding');
	});
});

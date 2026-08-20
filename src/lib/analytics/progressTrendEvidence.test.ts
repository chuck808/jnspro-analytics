import { describe, expect, it } from 'vitest';
import { buildProgressTrendEvidence } from './progressTrendEvidence';

describe('buildProgressTrendEvidence', () => {
	it('uses real engine technique, smoothness and power without inventing proxies', () => {
		const points = buildProgressTrendEvidence(
			[
				{
					sessionId: 's1',
					timestamp: '2026-08-01T10:00:00Z',
					techniqueScores: { overall: 82, smoothness: 74 },
					analysis: {
						selectedRun: { physics: { power: { averageW: 612, peakW: 941 } } }
					}
				},
				{
					sessionId: 's2',
					timestamp: '2026-08-02T10:00:00Z'
				}
			],
			[
				{ session_id: 's1', bias_correction_ms2: 0.2, analytics_valid: true },
				{ session_id: 's1', bias_correction_ms2: 0.6, analytics_valid: true }
			]
		);

		expect(points[0]).toMatchObject({
			techniqueOverall: 82,
			smoothness: 74,
			powerAverageW: 612,
			powerPeakW: 941,
			dataQualityBias: 0.4,
			dataQualityValid: true
		});

		// Missing engine evidence stays missing. Repeatability/G-force/mass are
		// deliberately not accepted by this adapter as substitutes.
		expect(points[1]).toMatchObject({
			techniqueOverall: null,
			smoothness: null,
			powerAverageW: null,
			powerPeakW: null,
			dataQualityBias: null,
			dataQualityValid: null
		});
	});

	it('aggregates data quality across the whole session rather than the first run', () => {
		const [point] = buildProgressTrendEvidence(
			[{ sessionId: 's1', timestamp: '2026-08-01T10:00:00Z' }],
			[
				{ session_id: 's1', bias_correction_ms2: 0.1, analytics_valid: true },
				{ session_id: 's1', bias_correction_ms2: 0.9, analytics_valid: false },
				{ session_id: 's1', bias_correction_ms2: null, analytics_valid: true }
			]
		);

		expect(point.dataQualityBias).toBeCloseTo(0.5);
		expect(point.dataQualityValid).toBe(false);
	});
});

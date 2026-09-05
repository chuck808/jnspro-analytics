import { describe, expect, it } from 'vitest';
import { buildDropOffEvidence, type DropOffSessionAnalysisLike } from './dropOffEvidence';

function iso(index: number) {
	return new Date(Date.UTC(2026, 0, index + 1)).toISOString();
}

function eligibleSession(
	index: number,
	dropOffRun?: number,
	supportedRunCount = 4
): DropOffSessionAnalysisLike {
	return {
		sessionId: `session-${index + 1}`,
		timestamp: iso(index),
		analysis: {
			intelligence: {
				dropOff: dropOffRun !== undefined ? { dropOffRun, dropPercent: 8 } : null,
				performancePersistence: { supportedRunCount }
			}
		}
	};
}

function ineligibleSessionNoIntelligence(index: number): DropOffSessionAnalysisLike {
	return { sessionId: `session-${index + 1}`, timestamp: iso(index), analysis: { intelligence: null } };
}

function ineligibleSessionShort(index: number): DropOffSessionAnalysisLike {
	return eligibleSession(index, undefined, 2);
}

describe('buildDropOffEvidence', () => {
	it('handles zero sessions with a genuinely empty state, not an eligible-floor message', () => {
		const model = buildDropOffEvidence([]);

		expect(model.totalSessionCount).toBe(0);
		expect(model.eligibleSessionCount).toBe(0);
		expect(model.detectedSessionCount).toBe(0);
		expect(model.detectionRate).toBeNull();
		expect(model.presentation.detectionStatement).toBe(
			'No sessions yet have enough valid speed runs to check for a fade. This will fill in as sessions are recorded.'
		);
	});

	it('withholds the detection rate below the eligible-session floor, even when every session answered', () => {
		const model = buildDropOffEvidence([eligibleSession(0), eligibleSession(1)]);

		expect(model.eligibleSessionCount).toBe(2);
		expect(model.detectedSessionCount).toBe(0);
		expect(model.detectionRate).toBeNull();
		expect(model.presentation.detectionStatement).toContain('at least 3 are needed');
	});

	it('excludes sessions with no intelligence or too few supported runs from the eligible denominator', () => {
		const sessions = [
			ineligibleSessionNoIntelligence(0),
			ineligibleSessionShort(1),
			eligibleSession(2),
			eligibleSession(3),
			eligibleSession(4)
		];
		const model = buildDropOffEvidence(sessions);

		expect(model.totalSessionCount).toBe(5);
		expect(model.eligibleSessionCount).toBe(3);
		expect(model.detectedSessionCount).toBe(0);
		expect(model.notDetectedSessionCount).toBe(3);
		expect(model.detectionRate?.percent).toBe(0);
	});

	it('reports zero detections across a real eligible history as good news, not a gap', () => {
		const sessions = Array.from({ length: 5 }, (_, index) => eligibleSession(index));
		const model = buildDropOffEvidence(sessions);

		expect(model.eligibleSessionCount).toBe(5);
		expect(model.detectedSessionCount).toBe(0);
		expect(model.detectionRate?.percent).toBe(0);
		expect(model.presentation.detectionStatement).toContain('genuinely good result');
		expect(model.presentation.detectionStatement).not.toContain('available yet');
		expect(model.presentation.distributionStatement).toContain('sustained pace, not missing evidence');
	});

	it('computes a real fractional detection rate', () => {
		const sessions = [
			eligibleSession(0, 6),
			eligibleSession(1, 7),
			eligibleSession(2),
			eligibleSession(3, 5),
			eligibleSession(4),
			eligibleSession(5, 9)
		];
		const model = buildDropOffEvidence(sessions);

		expect(model.eligibleSessionCount).toBe(6);
		expect(model.detectedSessionCount).toBe(4);
		expect(model.notDetectedSessionCount).toBe(2);
		expect(model.detectionRate?.percent).toBeCloseTo(66.6667, 4);
	});

	it('supports a trend toward a later drop-off position once five fades are detected', () => {
		const sessions = [
			eligibleSession(0, 3),
			eligibleSession(1, 3),
			eligibleSession(2, 3),
			eligibleSession(3, 7),
			eligibleSession(4, 8)
		];
		const model = buildDropOffEvidence(sessions);

		expect(model.trendState).toBe('supported-finding');
		expect(model.finding?.direction).toBe('later');
		expect(model.finding?.recentRun).toBe(7.5);
		expect(model.finding?.historicalRun).toBe(3);
		expect(model.finding?.changePercent).toBeCloseTo(150, 4);
		expect(model.presentation.distributionStatement).not.toContain('appears');
	});

	it('supports a trend toward an earlier drop-off position', () => {
		const sessions = [
			eligibleSession(0, 8),
			eligibleSession(1, 7),
			eligibleSession(2, 7),
			eligibleSession(3, 3),
			eligibleSession(4, 3)
		];
		const model = buildDropOffEvidence(sessions);

		expect(model.trendState).toBe('supported-finding');
		expect(model.finding?.direction).toBe('earlier');
		expect(model.finding?.changePercent).toBeCloseTo(-59.0909, 4);
	});

	it('reports a stable trend with cautious wording at early-signal depth', () => {
		const sessions = [eligibleSession(0, 5), eligibleSession(1, 5), eligibleSession(2, 5)];
		const model = buildDropOffEvidence(sessions);

		expect(model.trendState).toBe('early-signal');
		expect(model.finding?.direction).toBe('stable');
		expect(model.presentation.distributionStatement).toContain('broadly stable against');
	});

	it('bands the drop-off run into early, mid, and late using the legacy legend boundaries', () => {
		expect(buildDropOffEvidence([eligibleSession(0, 3)]).history[0].band).toBe('early');
		expect(buildDropOffEvidence([eligibleSession(0, 4)]).history[0].band).toBe('early');
		expect(buildDropOffEvidence([eligibleSession(0, 5)]).history[0].band).toBe('mid');
		expect(buildDropOffEvidence([eligibleSession(0, 7)]).history[0].band).toBe('mid');
		expect(buildDropOffEvidence([eligibleSession(0, 8)]).history[0].band).toBe('late');
	});

	it('never lets total or eligible session count alone promote the trend state', () => {
		const twentyWithOneDetection = Array.from({ length: 20 }, (_, index) =>
			eligibleSession(index, index === 19 ? 6 : undefined)
		);
		const oneDetectionModel = buildDropOffEvidence(twentyWithOneDetection);

		expect(oneDetectionModel.eligibleSessionCount).toBe(20);
		expect(oneDetectionModel.detectedSessionCount).toBe(1);
		expect(oneDetectionModel.trendState).toBe('measured');
		expect(oneDetectionModel.finding).toBeNull();

		const twentyWithTwoDetections = Array.from({ length: 20 }, (_, index) =>
			eligibleSession(index, index >= 18 ? 6 : undefined)
		);
		const twoDetectionModel = buildDropOffEvidence(twentyWithTwoDetections);

		expect(twoDetectionModel.detectedSessionCount).toBe(2);
		expect(twoDetectionModel.trendState).toBe('observed-history');
		expect(twoDetectionModel.finding).toBeNull();
		expect(twoDetectionModel.presentation.distributionStatement).toContain('No trend claim yet');
	});

	it('keeps the distribution counting detected sessions only, independent of not-detected sessions', () => {
		const sessions = [
			eligibleSession(0, 4), // early
			eligibleSession(1, 6), // mid
			eligibleSession(2, 9), // late
			eligibleSession(3),
			eligibleSession(4),
			eligibleSession(5),
			eligibleSession(6)
		];
		const model = buildDropOffEvidence(sessions);

		expect(model.eligibleSessionCount).toBe(7);
		expect(model.detectedSessionCount).toBe(3);
		expect(model.distribution).toEqual({ early: 1, mid: 1, late: 1 });
	});
});

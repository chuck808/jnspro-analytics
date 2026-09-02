import { describe, expect, it } from 'vitest';
import { buildPowerEvidence, type PowerSessionAnalysisLike } from './powerEvidence';

function makeSession(index: number, avg = 620 + index * 10, valid = true): PowerSessionAnalysisLike {
	return {
		sessionId: `session-${index + 1}`,
		timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
		analysis: {
			selectedRun: {
				analyticsValid: valid,
				physics: { power: { peakW: Math.round(avg * 1.5), averageW: avg, estimated: true } }
			}
		}
	};
}

function makeUnsupportedSession(index: number): PowerSessionAnalysisLike {
	return {
		sessionId: `session-${index + 1}`,
		timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
		analysis: { selectedRun: null }
	};
}

describe('buildPowerEvidence', () => {
	it('keeps one supported session as measured evidence only', () => {
		const model = buildPowerEvidence([makeSession(0)]);

		expect(model.state).toBe('measured');
		expect(model.supportedSessionCount).toBe(1);
		expect(model.finding).toBeNull();
		expect(model.presentation.label).toBe('Measured');
		expect(model.presentation.statement).toContain('average power baseline');
	});

	it('does not claim measured power evidence when none exists', () => {
		const empty = buildPowerEvidence([]);
		const unsupported = buildPowerEvidence([makeUnsupportedSession(0)]);

		for (const model of [empty, unsupported]) {
			expect(model.state).toBe('measured');
			expect(model.bestPeakPowerW).toBeNull();
			expect(model.supportedSessionCount).toBe(0);
			expect(model.presentation.statement).toBe(
				'No supported power measurement is available yet. Power history will appear as usable evidence is recorded.'
			);
		}
	});

	it('does not gate an analytics-invalid run into supported evidence', () => {
		const model = buildPowerEvidence([makeSession(0, 620, false)]);

		expect(model.state).toBe('measured');
		expect(model.supportedSessionCount).toBe(0);
		expect(model.bestPeakPowerW).toBeNull();
	});

	it('keeps measured peak power evidence distinct from average-power history', () => {
		const session = makeSession(0, 620);
		session.analysis.selectedRun!.physics!.power!.averageW = NaN;

		const model = buildPowerEvidence([session]);

		expect(model.bestPeakPowerW).toBe(930);
		expect(model.supportedSessionCount).toBe(0);
		expect(model.presentation.statement).toBe(
			'Measured peak power evidence is available, but average-power history is still building.'
		);
	});

	it('shows exactly two supported sessions as observed history without a trend claim', () => {
		const model = buildPowerEvidence([makeSession(0), makeSession(1)]);

		expect(model.state).toBe('observed-history');
		expect(model.history).toHaveLength(2);
		expect(model.finding).toBeNull();
		expect(model.presentation.label).toBe('Observed history');
		expect(model.presentation.statement).toBe('2 supported sessions show power history. No trend claim yet.');
	});

	it('treats four supported sessions as an early signal', () => {
		const model = buildPowerEvidence(Array.from({ length: 4 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('early-signal');
		expect(model.supportedSessionCount).toBe(4);
		expect(model.windowSize).toBe(4);
		expect(model.finding?.direction).toBe('improving');
		expect(model.presentation.label).toBe('Early signal');
		expect(model.presentation.statement).toContain('appears');
		expect(model.presentation.statement).toContain('higher than');
		expect(model.presentation.statement).toContain('latest 4 supported sessions');
	});

	it('treats seven supported sessions as a supported finding over the recent five-session window', () => {
		const model = buildPowerEvidence(Array.from({ length: 7 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('supported-finding');
		expect(model.supportedSessionCount).toBe(7);
		expect(model.windowSize).toBe(5);
		expect(model.finding?.direction).toBe('improving');
		expect(model.presentation.label).toBe('Supported finding');
		expect(model.presentation.statement).not.toContain('appears');
		expect(model.presentation.statement).toContain('latest 5 supported sessions');
	});

	it('does not turn twelve-session maturity into a wider or higher-authority power window', () => {
		const model = buildPowerEvidence(Array.from({ length: 12 }, (_, index) => makeSession(index)));

		expect(model.state).toBe('supported-finding');
		expect(model.supportedSessionCount).toBe(12);
		expect(model.totalSessionCount).toBe(12);
		expect(model.windowSize).toBe(5);
		expect(model.presentation.statement).toContain('latest 5 supported sessions');
	});

	it('uses supported power observations rather than total session count for evidence maturity', () => {
		const sessions = Array.from({ length: 7 }, (_, index) => makeSession(index));
		for (let index = 2; index < sessions.length; index += 1) {
			sessions[index] = makeUnsupportedSession(index);
		}

		const model = buildPowerEvidence(sessions);

		expect(model.totalSessionCount).toBe(7);
		expect(model.supportedSessionCount).toBe(2);
		expect(model.state).toBe('observed-history');
		expect(model.finding).toBeNull();
		expect(model.presentation.statement).toBe('2 supported sessions show power history. No trend claim yet.');
	});

	it('excludes a null session from the supported trend window instead of coercing it to zero', () => {
		const sessions = [
			makeSession(0, 600),
			makeSession(1, 620),
			makeUnsupportedSession(2),
			makeSession(3, 660),
			makeSession(4, 680),
			makeSession(5, 700)
		];

		const model = buildPowerEvidence(sessions);

		expect(model.totalSessionCount).toBe(6);
		expect(model.supportedSessionCount).toBe(5);
		expect(model.windowSize).toBe(5);
		expect(model.history.map((item) => item.sessionId)).not.toContain('session-3');
		expect(model.finding?.direction).toBe('improving');
		expect(model.finding?.historicalAverageW).toBeCloseTo(626.6667, 4);
		expect(model.finding?.recentAverageW).toBe(690);
		expect(model.finding?.changePercent).toBeCloseTo(10.1064, 4);
	});

	it('uses cautious wording for an early declining signal', () => {
		const sessions = [makeSession(0, 700), makeSession(1, 680), makeSession(2, 660), makeSession(3, 640)];
		const model = buildPowerEvidence(sessions);

		expect(model.finding?.direction).toBe('declining');
		expect(model.presentation.label).toBe('Early signal');
		expect(model.presentation.statement).toContain('appears');
		expect(model.presentation.statement).toContain('lower than');
	});
});

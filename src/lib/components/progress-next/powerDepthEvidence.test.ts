import { describe, expect, it } from 'vitest';
import { buildPowerEvidence } from './powerEvidence';
import { buildPowerPeakEvidence } from './powerPeakEvidence';
import { buildPowerContextEvidence } from './powerContextEvidence';
import { buildPowerSynthesisEvidence } from './powerSynthesisEvidence';
import { buildPowerDepthEvidence } from './powerDepthEvidence';
import type { PowerSessionAnalysisLike } from './powerEvidence';

function makeSession(index: number, avg = 620 + index * 10, peakSupported = true): PowerSessionAnalysisLike {
	return {
		sessionId: `session-${index + 1}`,
		timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
		analysis: {
			selectedRun: {
				analyticsValid: true,
				physics: { power: { averageW: avg, peakW: peakSupported ? avg * 1.5 : NaN, estimated: true } }
			}
		}
	};
}

function build(sessions: PowerSessionAnalysisLike[]) {
	const power = buildPowerEvidence(sessions);
	const peak = buildPowerPeakEvidence(sessions);
	const context = buildPowerContextEvidence([], power.supportedSessionCount, sessions.length);
	const synthesis = buildPowerSynthesisEvidence(power, peak);
	return buildPowerDepthEvidence(power, peak, context, synthesis);
}

describe('buildPowerDepthEvidence', () => {
	it('keeps the two-session persona in a purposeful building state', () => {
		const model = build([makeSession(0), makeSession(1)]);

		expect(model.stage).toBe('building');
		expect(model.presentation.label).toBe('Building');
		expect(model.unlocks.history).toBe(true);
		expect(model.unlocks.direction).toBe(false);
		expect(model.unlocks.peakHistory).toBe(true);
		expect(model.unlocks.peakDirection).toBe(false);
		expect(model.unlocks.context).toBe(false);
		expect(model.unlocks.synthesis).toBe(false);
	});

	it('maps the four-session persona to emerging without upgrading individual evidence', () => {
		const model = build(Array.from({ length: 4 }, (_, index) => makeSession(index)));

		expect(model.stage).toBe('emerging');
		expect(model.unlocks.direction).toBe(true);
		expect(model.unlocks.peakDirection).toBe(true);
		expect(model.unlocks.context).toBe(false);
		expect(model.unlocks.synthesis).toBe(true);
	});

	it('maps seven supported sessions to developing while context analysis is still unavailable', () => {
		const model = build(Array.from({ length: 7 }, (_, index) => makeSession(index)));

		expect(model.stage).toBe('developing');
		expect(model.unlocks.direction).toBe(true);
		expect(model.unlocks.context).toBe(false);
	});

	it('maps twelve supported sessions to established once contextual analysis has genuinely run', () => {
		const model = build(Array.from({ length: 12 }, (_, index) => makeSession(index)));

		expect(model.stage).toBe('established');
		expect(model.unlocks.context).toBe(true);
		// No significant contextual finding is required for overall depth to be
		// established: a truthful no-pattern result means the analysis has run.
	});

	it('does not let twelve total sessions promote Power when only two support it', () => {
		const sessions = Array.from({ length: 12 }, (_, index) => makeSession(index)).map((session, index) =>
			index < 2 ? session : { ...session, analysis: { selectedRun: null } }
		);
		const model = build(sessions);

		expect(model.totalSessionCount).toBe(12);
		expect(model.supportedSessionCount).toBe(2);
		expect(model.stage).toBe('building');
		expect(model.unlocks.direction).toBe(false);
		expect(model.unlocks.context).toBe(false);
	});

	it('reaches established primary depth while peak power stays a materially less mature secondary layer', () => {
		const sessions = Array.from({ length: 12 }, (_, index) => makeSession(index, 620 + index * 10, index >= 10));
		const model = build(sessions);

		expect(model.stage).toBe('established');
		expect(model.unlocks.direction).toBe(true);
		expect(model.unlocks.peakHistory).toBe(true);
		expect(model.unlocks.peakDirection).toBe(false);
	});
});

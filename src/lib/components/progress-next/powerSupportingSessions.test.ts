import { describe, expect, it } from 'vitest';
import { buildPowerEvidence, type PowerSessionAnalysisLike } from './powerEvidence';
import { buildPowerPeakEvidence } from './powerPeakEvidence';
import { buildPowerSupportingSessions } from './powerSupportingSessions';

function makeSession(index: number, peak: number | null = 900 + index * 5): PowerSessionAnalysisLike {
	return {
		sessionId: `session-${index + 1}`,
		timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
		analysis: {
			selectedRun: {
				analyticsValid: true,
				physics: { power: { averageW: 620 + index * 10, peakW: peak === null ? NaN : peak, estimated: true } }
			}
		}
	};
}

function build(sessions: PowerSessionAnalysisLike[]) {
	return buildPowerSupportingSessions(buildPowerEvidence(sessions), buildPowerPeakEvidence(sessions));
}

describe('buildPowerSupportingSessions', () => {
	it('does not invent direction support before a finding exists', () => {
		const model = build([makeSession(0), makeSession(1)]);

		expect(model.powerDirectionSessionIds).toEqual([]);
		expect(model.peakPowerDirectionSessionIds).toEqual([]);
		expect(model.sessions.every((session) => !session.supportsPowerDirection)).toBe(true);
		expect(model.sessions.every((session) => !session.supportsPeakPowerDirection)).toBe(true);
	});

	it('traces a supported Power finding to the exact latest evidence window', () => {
		const model = build(Array.from({ length: 7 }, (_, index) => makeSession(index)));

		expect(model.powerDirectionSessionIds).toEqual([
			'session-3',
			'session-4',
			'session-5',
			'session-6',
			'session-7'
		]);
		expect(
			model.sessions.filter((session) => session.supportsPowerDirection).map((session) => session.sessionId)
		).toEqual(['session-7', 'session-6', 'session-5', 'session-4', 'session-3']);
	});

	it('keeps sparse peak-power support independent from established average-power history', () => {
		const sessions = Array.from({ length: 12 }, (_, index) =>
			makeSession(index, index < 2 ? 900 + index * 5 : null)
		);
		const model = build(sessions);

		expect(model.sessions).toHaveLength(12);
		expect(model.powerDirectionSessionIds).toHaveLength(5);
		expect(model.peakPowerDirectionSessionIds).toEqual([]);
		expect(
			model.sessions.filter((session) => session.supportsPeakPower).map((session) => session.sessionId)
		).toEqual(['session-2', 'session-1']);
		expect(model.sessions.every((session) => !session.supportsPeakPowerDirection)).toBe(true);
	});

	it('uses only peak-supported history for the peak-power direction window', () => {
		const sessions = Array.from({ length: 8 }, (_, index) =>
			makeSession(index, index === 4 || index === 6 ? null : 900 + index * 5)
		);
		const model = build(sessions);

		expect(model.peakPowerDirectionSessionIds).toEqual([
			'session-2',
			'session-3',
			'session-4',
			'session-6',
			'session-8'
		]);
		expect(model.sessions.find((session) => session.sessionId === 'session-7')?.supportsPeakPower).toBe(false);
		expect(model.sessions.find((session) => session.sessionId === 'session-6')?.supportsPeakPowerDirection).toBe(
			true
		);
	});
});

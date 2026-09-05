import { describe, expect, it } from 'vitest';
import { buildWheeliePatternEvidence, type WheelieRunLike } from './wheeliePatternEvidence';

function run(
	sessionId: string,
	reactionTimeMs: number | null,
	frontWheelLifted: boolean | null,
	analyticsValid: boolean | null = true
): WheelieRunLike {
	return {
		session_id: sessionId,
		reaction_time_ms: reactionTimeMs,
		front_wheel_lifted: frontWheelLifted,
		analytics_valid: analyticsValid
	};
}

/** Builds N runs, each in its own session, alternating a fixed reaction value. */
function group(count: number, wheelie: boolean, reactionTimeMs: number, sessionPrefix: string) {
	return Array.from({ length: count }, (_, i) => run(`${sessionPrefix}-${i + 1}`, reactionTimeMs, wheelie));
}

describe('buildWheeliePatternEvidence', () => {
	it('returns absent with zero counts for empty input', () => {
		const evidence = buildWheeliePatternEvidence([]);

		expect(evidence.state).toBe('absent');
		expect(evidence).toMatchObject({
			wheelieRunCount: 0,
			wheelieSessionCount: 0,
			nonWheelieRunCount: 0,
			nonWheelieSessionCount: 0,
			finding: null
		});
	});

	it('keeps state absent when only one side has any runs', () => {
		const runs = group(6, true, 200, 'w');
		const evidence = buildWheeliePatternEvidence(runs);

		expect(evidence.state).toBe('absent');
		expect(evidence.wheelieRunCount).toBe(6);
		expect(evidence.nonWheelieRunCount).toBe(0);
	});

	it('keeps state absent when a group clears the run-count floor but not the session-diversity floor', () => {
		// 6 wheelie runs, all in a single session — the exact legacy flaw.
		const wheelieRuns = Array.from({ length: 6 }, () => run('same-session', 200, true));
		const nonWheelieRuns = group(6, false, 220, 'nw');
		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns]);

		expect(evidence.state).toBe('absent');
		expect(evidence.wheelieRunCount).toBe(6);
		expect(evidence.wheelieSessionCount).toBe(1);
	});

	it('keeps state absent when one side is below the run-count floor even though the other is well-supported', () => {
		const wheelieRuns = group(10, true, 200, 'w');
		// 4 runs across 3 sessions: below MIN_GROUP_RUN_COUNT even though session
		// diversity is fine.
		const nonWheelieRuns = [
			run('nw-1', 220, false),
			run('nw-1', 222, false),
			run('nw-2', 218, false),
			run('nw-3', 221, false)
		];
		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns]);

		expect(evidence.state).toBe('absent');
		expect(evidence.nonWheelieRunCount).toBe(4);
	});

	it('excludes analytics_valid=false readings from both groups', () => {
		const validWheelie = group(5, true, 200, 'w');
		const invalidWheelie = [run('w-invalid-1', 100, true, false), run('w-invalid-2', 100, true, false)];
		const validNonWheelie = group(5, false, 220, 'nw');
		const invalidNonWheelie = [run('nw-invalid-1', 900, false, false)];

		const evidence = buildWheeliePatternEvidence([
			...validWheelie,
			...invalidWheelie,
			...validNonWheelie,
			...invalidNonWheelie
		]);

		expect(evidence.wheelieRunCount).toBe(5);
		expect(evidence.nonWheelieRunCount).toBe(5);
	});

	it('excludes runs with unknown front_wheel_lifted from both groups instead of treating them as non-wheelie', () => {
		const wheelieRuns = group(5, true, 200, 'w');
		const nonWheelieRuns = group(5, false, 220, 'nw');
		const unknownRuns = [run('u-1', 500, null), run('u-2', 500, undefined as unknown as null)];

		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns, ...unknownRuns]);

		expect(evidence.wheelieRunCount).toBe(5);
		expect(evidence.nonWheelieRunCount).toBe(5);
	});

	it('excludes non-finite or null reaction_time_ms readings even when otherwise eligible', () => {
		const wheelieRuns = group(5, true, 200, 'w');
		const nonWheelieRuns = group(5, false, 220, 'nw');
		const badReadings = [
			run('bad-1', null, true),
			run('bad-2', Number.NaN, true),
			run('bad-3', Number.POSITIVE_INFINITY, false)
		];

		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns, ...badReadings]);

		expect(evidence.wheelieRunCount).toBe(5);
		expect(evidence.nonWheelieRunCount).toBe(5);
	});

	it('returns no-pattern once both groups clear the sample floor but the means differ by less than 5%', () => {
		// wheelie avg 500ms, non-wheelie avg 510ms -> ~1.96% difference.
		const wheelieRuns = group(5, true, 500, 'w');
		const nonWheelieRuns = group(5, false, 510, 'nw');
		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns]);

		expect(evidence.state).toBe('no-pattern');
		expect(evidence.finding).toBeNull();
	});

	it('returns a contextual finding with the real group averages, counts, and direction once the difference clears 5%', () => {
		// wheelie avg 450ms, non-wheelie avg 520ms -> ~13.46% difference, wheelie faster.
		const wheelieRuns = group(6, true, 450, 'w');
		const nonWheelieRuns = group(6, false, 520, 'nw');
		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns]);

		expect(evidence.state).toBe('contextual-finding');
		expect(evidence.finding).toMatchObject({
			direction: 'wheelie-faster',
			wheelieAverageReactionMs: 450,
			nonWheelieAverageReactionMs: 520
		});
		expect(evidence.finding?.differencePercent).toBeCloseTo(((450 - 520) / 520) * 100, 5);
	});

	it('labels the opposite direction correctly when wheelie starts are slower', () => {
		const wheelieRuns = group(6, true, 560, 'w');
		const nonWheelieRuns = group(6, false, 480, 'nw');
		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns]);

		expect(evidence.state).toBe('contextual-finding');
		expect(evidence.finding?.direction).toBe('wheelie-slower');
	});

	it('keeps raw counts visible in the absent state so progress toward the threshold is legible', () => {
		const wheelieRuns = group(3, true, 200, 'w');
		const nonWheelieRuns = group(2, false, 220, 'nw');
		const evidence = buildWheeliePatternEvidence([...wheelieRuns, ...nonWheelieRuns]);

		expect(evidence.state).toBe('absent');
		expect(evidence.wheelieRunCount).toBe(3);
		expect(evidence.wheelieSessionCount).toBe(3);
		expect(evidence.nonWheelieRunCount).toBe(2);
		expect(evidence.nonWheelieSessionCount).toBe(2);
	});
});

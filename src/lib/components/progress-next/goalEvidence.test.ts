import { describe, expect, it } from 'vitest';
import { buildProgressGoalEvidence } from './goalEvidence';

describe('buildProgressGoalEvidence', () => {
	it('calculates lower-is-better progress from frozen start/current/target values', () => {
		const model = buildProgressGoalEvidence({
			reactionTime: { start: 320, current: 300, target: 280, deadline: null }
		});

		expect(model.goals[0]).toMatchObject({
			metric: 'reactionTime',
			label: 'Reaction time',
			progressPercent: 50,
			state: 'measured'
		});
	});

	it('calculates higher-is-better progress without inventing direction in the component', () => {
		const model = buildProgressGoalEvidence({
			peakSpeed: { start: 28, current: 31, target: 34, deadline: null }
		});

		expect(model.goals[0].progressPercent).toBe(50);
	});

	it('keeps missing or degenerate evidence unavailable instead of coercing it to zero', () => {
		const model = buildProgressGoalEvidence({
			maxG: { start: 0.8, current: null, target: 1.1, deadline: null },
			peakSpeed: { start: 30, current: 30, target: 30, deadline: null }
		});

		expect(model.goals.map((goal) => [goal.progressPercent, goal.state])).toEqual([
			[null, 'unavailable'],
			[null, 'unavailable']
		]);
	});

	it('clamps presentation completion while preserving the frozen current value', () => {
		const model = buildProgressGoalEvidence({
			reactionTime: { start: 320, current: 260, target: 280, deadline: null }
		});

		expect(model.goals[0]).toMatchObject({ current: 260, progressPercent: 100 });
	});
});

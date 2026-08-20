import { describe, expect, it } from 'vitest';
import { projectGoalEvidenceFromSessions } from './goalEvidenceProjection';

type Gate = {
	reaction_time_ms: number;
	max_g: number;
	peak_speed_ms: number | null;
	analytics_valid: boolean;
	time_to_peak_speed_ms: number | null;
};

function gate(overrides: Partial<Gate> = {}): Gate {
	return {
		reaction_time_ms: 300,
		max_g: 0.8,
		peak_speed_ms: 8,
		analytics_valid: true,
		time_to_peak_speed_ms: 900,
		...overrides
	};
}

type Run = {
	elapsed_time_ms: number;
	distance_m: number;
	tags: string[];
	gate_runs: Gate;
};

function run(overrides: Partial<Run> = {}): Run {
	return {
		elapsed_time_ms: 2500,
		distance_m: 10,
		tags: [],
		gate_runs: gate(),
		...overrides
	};
}

const createdAt = '2026-01-01T00:00:00.000Z';

describe('projectGoalEvidenceFromSessions', () => {
	it('uses canonical eligibility and reverses when the former PB is excluded', () => {
		const goal = [{ id: 'g1', metric: 'reactionTime', start_value: 320, created_at: createdAt }];
		const sessions = [
			{
				id: 's1',
				timestamp: '2026-01-02T00:00:00.000Z',
				runs: [run({ gate_runs: gate({ reaction_time_ms: 300 }) })]
			},
			{
				id: 's2',
				timestamp: '2026-01-03T00:00:00.000Z',
				runs: [run({ gate_runs: gate({ reaction_time_ms: 280 }) })]
			}
		];

		expect(projectGoalEvidenceFromSessions(goal, sessions).g1.currentValue).toBe(280);

		sessions[1].runs[0].tags = ['warmup'];
		expect(projectGoalEvidenceFromSessions(goal, sessions).g1.currentValue).toBe(300);
	});

	it('tracks peak speed from analytics-valid evidence', () => {
		const goal = [{ id: 'g2', metric: 'peakSpeed', start_value: 7, created_at: createdAt }];
		const sessions = [
			{
				id: 's1',
				timestamp: '2026-01-02T00:00:00.000Z',
				runs: [run({ gate_runs: gate({ peak_speed_ms: 8.4 }) })]
			}
		];

		expect(projectGoalEvidenceFromSessions(goal, sessions).g2.currentValue).toBe(8.4);
	});

	it('honours distance on elapsed-time goals', () => {
		const goal = [
			{ id: 'g3', metric: 'elapsedTime', start_value: 3, created_at: createdAt, distance_m: 10 }
		];
		const sessions = [
			{
				id: 's1',
				timestamp: '2026-01-02T00:00:00.000Z',
				runs: [
					run({ distance_m: 5, elapsed_time_ms: 1000 }),
					run({ distance_m: 10, elapsed_time_ms: 2400 })
				]
			}
		];

		expect(projectGoalEvidenceFromSessions(goal, sessions).g3.currentValue).toBe(2.4);
	});

	it('records only significant improvements as milestones while retaining the best current value', () => {
		const goal = [{ id: 'g4', metric: 'reactionTime', start_value: 300, created_at: createdAt }];
		const sessions = [
			{
				id: 's1',
				timestamp: '2026-01-02T00:00:00.000Z',
				runs: [run({ gate_runs: gate({ reaction_time_ms: 299 }) })]
			},
			{
				id: 's2',
				timestamp: '2026-01-03T00:00:00.000Z',
				runs: [run({ gate_runs: gate({ reaction_time_ms: 298 }) })]
			}
		];

		const projection = projectGoalEvidenceFromSessions(goal, sessions).g4;
		expect(projection.currentValue).toBe(298);
		expect(projection.milestones).toHaveLength(1);
		expect(projection.milestones[0].value).toBe(298);
	});
});

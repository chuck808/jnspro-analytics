export interface ProgressGoalTarget {
	target: number | null;
	start: number | null;
	current: number | null;
	deadline?: string | null;
}

export type ProgressGoalEvidenceState = 'unavailable' | 'measured';

export interface ProgressGoalEvidenceItem {
	metric: string;
	label: string;
	start: number | null;
	current: number | null;
	target: number | null;
	deadline: string | null;
	progressPercent: number | null;
	state: ProgressGoalEvidenceState;
}

export interface ProgressGoalEvidenceModel {
	goals: ProgressGoalEvidenceItem[];
}

const LOWER_IS_BETTER = new Set(['reactionTime', 'elapsedTime', 'accelerationPhase']);

const LABELS: Record<string, string> = {
	reactionTime: 'Reaction time',
	elapsedTime: 'Elapsed time',
	accelerationPhase: 'Acceleration phase',
	peakSpeed: 'Peak speed',
	maxG: 'Peak G',
	consistency: 'Consistency'
};

function metricLabel(metric: string): string {
	return (
		LABELS[metric] ??
		metric.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase())
	);
}

function progressPercent(metric: string, goal: ProgressGoalTarget): number | null {
	const { start, current, target } = goal;
	if (start == null || current == null || target == null || start === target) return null;

	const denominator = LOWER_IS_BETTER.has(metric) ? start - target : target - start;
	if (denominator === 0) return null;

	const numerator = LOWER_IS_BETTER.has(metric) ? start - current : current - start;
	const raw = (numerator / denominator) * 100;
	if (!Number.isFinite(raw)) return null;

	return Math.round(Math.min(100, Math.max(0, raw)));
}

export function buildProgressGoalEvidence(
	goalTargets: Record<string, ProgressGoalTarget>
): ProgressGoalEvidenceModel {
	return {
		goals: Object.entries(goalTargets).map(([metric, goal]) => {
			const progress = progressPercent(metric, goal);
			return {
				metric,
				label: metricLabel(metric),
				start: goal.start,
				current: goal.current,
				target: goal.target,
				deadline: goal.deadline ?? null,
				progressPercent: progress,
				state: progress === null ? 'unavailable' : 'measured'
			};
		})
	};
}

/**
 * Progress Evaluator for Adaptive Goals
 *
 * Evaluates whether users are ahead of schedule, behind, or on track.
 * Determines when goal adjustments should be suggested.
 */

export type ProgressStatus =
	| 'way_ahead'
	| 'ahead'
	| 'on_track'
	| 'behind'
	| 'way_behind'
	| 'stalled';

export interface ProgressEvaluation {
	status: ProgressStatus;
	percentageComplete: number; // 0-100
	expectedCompletion: number; // Expected % complete by now
	actualCompletion: number; // Actual % complete
	variance: number; // Difference from expected (positive = ahead)
	estimatedDaysRemaining: number;
	originalEstimate: number;
	daysElapsed: number;
	totalDays: number;
	shouldAdjust: boolean;
	adjustmentReason: string | null;
}

interface GoalData {
	startValue: number;
	targetValue: number;
	currentValue: number;
	startDate: Date;
	deadline: Date;
	lowerIsBetter: boolean;
}

/**
 * Evaluate progress towards a goal
 */
export function evaluateGoalProgress(
	goal: GoalData,
	sessionsRemaining: number | null
): ProgressEvaluation {
	const now = new Date();
	const daysElapsed = Math.max(
		0,
		Math.floor((now.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24))
	);
	const totalDays = Math.floor(
		(goal.deadline.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
	);
	const daysRemaining = Math.max(0, totalDays - daysElapsed);

	// Calculate actual progress
	const totalChange = Math.abs(goal.targetValue - goal.startValue);
	const actualChange = Math.abs(goal.currentValue - goal.startValue);
	const actualCompletion = totalChange > 0 ? (actualChange / totalChange) * 100 : 0;

	// Calculate expected progress (linear for now)
	const timeElapsedRatio = totalDays > 0 ? daysElapsed / totalDays : 0;
	const expectedCompletion = timeElapsedRatio * 100;

	// Variance (positive = ahead of schedule)
	const variance = actualCompletion - expectedCompletion;

	// Determine status
	const status = determineStatus(variance, actualCompletion);

	// Should we adjust?
	const { shouldAdjust, adjustmentReason } = shouldSuggestAdjustment(
		status,
		variance,
		actualCompletion,
		daysRemaining,
		sessionsRemaining
	);

	// Estimate days remaining based on current pace
	let estimatedDaysRemaining = daysRemaining;
	if (actualCompletion > 10 && daysElapsed > 0) {
		const currentPace = actualCompletion / daysElapsed; // % per day
		const remainingProgress = 100 - actualCompletion;
		if (currentPace > 0) {
			estimatedDaysRemaining = Math.ceil(remainingProgress / currentPace);
		}
	}

	return {
		status,
		percentageComplete: Math.min(100, Math.max(0, actualCompletion)),
		expectedCompletion: Math.min(100, expectedCompletion),
		actualCompletion: Math.min(100, actualCompletion),
		variance,
		estimatedDaysRemaining,
		originalEstimate: daysRemaining,
		daysElapsed,
		totalDays,
		shouldAdjust,
		adjustmentReason
	};
}

/**
 * Determine progress status from variance
 */
function determineStatus(variance: number, actualCompletion: number): ProgressStatus {
	// Stalled if no significant progress and time has passed
	if (actualCompletion < 5 && variance < -20) {
		return 'stalled';
	}

	// Way ahead if more than 30% ahead of schedule
	if (variance > 30) return 'way_ahead';

	// Ahead if more than 15% ahead
	if (variance > 15) return 'ahead';

	// Way behind if more than 30% behind
	if (variance < -30) return 'way_behind';

	// Behind if more than 15% behind
	if (variance < -15) return 'behind';

	// On track otherwise (within ±15%)
	return 'on_track';
}

/**
 * Determine if adjustment should be suggested
 */
function shouldSuggestAdjustment(
	status: ProgressStatus,
	variance: number,
	actualCompletion: number,
	daysRemaining: number,
	sessionsRemaining: number | null
): { shouldAdjust: boolean; adjustmentReason: string | null } {
	// Suggest stretch goal if way ahead
	if (status === 'way_ahead' && actualCompletion > 40) {
		return {
			shouldAdjust: true,
			adjustmentReason: "You're way ahead of schedule - consider setting a more ambitious target"
		};
	}

	// Suggest stretch goal if ahead and halfway through
	if (status === 'ahead' && actualCompletion > 50) {
		return {
			shouldAdjust: true,
			adjustmentReason: "You're ahead of pace - you could aim higher"
		};
	}

	// Suggest deadline extension if way behind
	if (status === 'way_behind' && daysRemaining < 30) {
		return {
			shouldAdjust: true,
			adjustmentReason: 'Current pace suggests you need more time - consider extending the deadline'
		};
	}

	// Suggest target reduction if behind and time running out
	if (status === 'behind' && daysRemaining < 14 && actualCompletion < 50) {
		return {
			shouldAdjust: true,
			adjustmentReason:
				'Limited time remaining - consider adjusting your target to maintain motivation'
		};
	}

	// Suggest revision if stalled
	if (status === 'stalled') {
		return {
			shouldAdjust: true,
			adjustmentReason: 'Progress has stalled - reassess your goal or approach'
		};
	}

	// Suggest completion if almost done
	if (actualCompletion >= 95) {
		return {
			shouldAdjust: true,
			adjustmentReason: "You're almost there! One more push to complete this goal"
		};
	}

	return { shouldAdjust: false, adjustmentReason: null };
}

/**
 * Get status color for UI
 */
export function getProgressStatusColor(status: ProgressStatus): string {
	switch (status) {
		case 'way_ahead':
			return '#3de8c8'; // Teal (excellent)
		case 'ahead':
			return '#3de8c8'; // Teal (good)
		case 'on_track':
			return '#f5a623'; // Amber (normal)
		case 'behind':
			return '#ff6b3d'; // Orange (concerning)
		case 'way_behind':
			return '#ff4444'; // Red (critical)
		case 'stalled':
			return '#ff4444'; // Red (critical)
	}
}

/**
 * Get status emoji for quick visual
 */
export function getProgressStatusEmoji(status: ProgressStatus): string {
	switch (status) {
		case 'way_ahead':
			return '🚀';
		case 'ahead':
			return '⬆️';
		case 'on_track':
			return '✅';
		case 'behind':
			return '⚠️';
		case 'way_behind':
			return '🐌';
		case 'stalled':
			return '⏸️';
	}
}

/**
 * Get progress message for display
 */
export function getProgressMessage(evaluation: ProgressEvaluation): string {
	switch (evaluation.status) {
		case 'way_ahead':
			return `You're ${Math.abs(evaluation.variance).toFixed(0)}% ahead of schedule! Outstanding progress!`;
		case 'ahead':
			return `You're ${Math.abs(evaluation.variance).toFixed(0)}% ahead of schedule. Keep it up!`;
		case 'on_track':
			return "You're right on track. Steady progress!";
		case 'behind':
			return `You're ${Math.abs(evaluation.variance).toFixed(0)}% behind schedule. Focus on consistency.`;
		case 'way_behind':
			return `You're ${Math.abs(evaluation.variance).toFixed(0)}% behind schedule. Consider reassessing your timeline.`;
		case 'stalled':
			return 'Progress has stalled. Review your approach or adjust your goal.';
	}
}

/**
 * Calculate progress velocity (rate of improvement)
 */
export function calculateVelocity(
	sessionValues: Array<{ date: Date; value: number }>,
	lowerIsBetter: boolean
): number {
	if (sessionValues.length < 2) return 0;

	// Simple linear regression for velocity
	const n = sessionValues.length;
	const points = sessionValues.map((sv, i) => ({
		x: i, // Session index
		y: sv.value
	}));

	let sumX = 0,
		sumY = 0,
		sumXY = 0,
		sumX2 = 0;
	for (const p of points) {
		sumX += p.x;
		sumY += p.y;
		sumXY += p.x * p.y;
		sumX2 += p.x * p.x;
	}

	const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

	// Velocity is the slope (rate of change per session)
	// Positive velocity means improving if lowerIsBetter, declining if higher is better
	return lowerIsBetter ? -slope : slope;
}

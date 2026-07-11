/**
 * Goal Adaptation Service
 *
 * Intelligently evaluates goal progress and generates adaptive suggestions
 * to keep users motivated and on track.
 */

// Re-export all modules
export * from './progressEvaluator';
export * from './suggestionGenerator';

// Main adaptation interface
import { evaluateGoalProgress, type ProgressEvaluation } from './progressEvaluator';
import {
	generateAdjustmentSuggestions,
	type GoalAdjustmentSuggestion
} from './suggestionGenerator';

/**
 * Complete adaptive goal analysis
 */
export interface AdaptiveGoalAnalysis {
	progressEvaluation: ProgressEvaluation;
	suggestions: GoalAdjustmentSuggestion[];
	recommendedAction: 'continue' | 'adjust' | 'celebrate' | 'pause';
	actionMessage: string;
}

/**
 * Perform comprehensive goal adaptation analysis
 *
 * @param goalData Current goal information
 * @param performanceData Recent performance metrics
 * @param healthStatus Health check results
 * @returns Complete analysis with actionable suggestions
 */
export function analyzeGoalAdaptation(
	goalData: {
		metric: string;
		startValue: number;
		targetValue: number;
		currentValue: number;
		startDate: Date;
		deadline: Date;
		lowerIsBetter: boolean;
	},
	performanceData: {
		sessionsRemaining: number | null;
	},
	healthStatus: {
		shouldRest: boolean;
	}
): AdaptiveGoalAnalysis {
	// 1. Evaluate progress
	const progressEvaluation = evaluateGoalProgress(
		{
			startValue: goalData.startValue,
			targetValue: goalData.targetValue,
			currentValue: goalData.currentValue,
			startDate: goalData.startDate,
			deadline: goalData.deadline,
			lowerIsBetter: goalData.lowerIsBetter
		},
		performanceData.sessionsRemaining
	);

	// 2. Generate suggestions
	const suggestions = generateAdjustmentSuggestions({
		currentTarget: goalData.targetValue,
		currentDeadline: goalData.deadline,
		startValue: goalData.startValue,
		currentValue: goalData.currentValue,
		lowerIsBetter: goalData.lowerIsBetter,
		progressEvaluation,
		shouldRest: healthStatus.shouldRest,
		metric: goalData.metric
	});

	// 3. Determine recommended action
	const { action, message } = determineRecommendedAction(
		progressEvaluation,
		suggestions,
		healthStatus.shouldRest
	);

	return {
		progressEvaluation,
		suggestions,
		recommendedAction: action,
		actionMessage: message
	};
}

/**
 * Determine the primary recommended action
 */
function determineRecommendedAction(
	evaluation: ProgressEvaluation,
	suggestions: GoalAdjustmentSuggestion[],
	shouldRest: boolean
): { action: AdaptiveGoalAnalysis['recommendedAction']; message: string } {
	// Pause if health is at risk
	if (shouldRest) {
		return {
			action: 'pause',
			message: 'Pause this goal to focus on recovery. Your health comes first!'
		};
	}

	// Celebrate if complete
	if (evaluation.actualCompletion >= 100) {
		return {
			action: 'celebrate',
			message: '🎉 Goal achieved! Time to celebrate and set a new challenge!'
		};
	}

	// Nearly complete
	if (evaluation.actualCompletion >= 95) {
		return {
			action: 'celebrate',
			message: '🎯 So close! One final push to complete this goal!'
		};
	}

	// High priority suggestions exist
	const highPrioritySuggestions = suggestions.filter((s) => s.priority === 'high');
	if (highPrioritySuggestions.length > 0) {
		return {
			action: 'adjust',
			message: `Consider ${highPrioritySuggestions.length} important adjustment${highPrioritySuggestions.length > 1 ? 's' : ''} to keep you on track`
		};
	}

	// Medium priority suggestions
	const mediumPrioritySuggestions = suggestions.filter((s) => s.priority === 'medium');
	if (mediumPrioritySuggestions.length > 0) {
		return {
			action: 'adjust',
			message: 'Some optional adjustments available to optimize your progress'
		};
	}

	// All good - continue
	return {
		action: 'continue',
		message: "You're on track! Keep up the great work!"
	};
}

/**
 * Quick check if goal needs immediate attention
 */
export function needsAttention(analysis: AdaptiveGoalAnalysis): boolean {
	// Needs attention if there are high priority suggestions
	const highPrioritySuggestions = analysis.suggestions.filter((s) => s.priority === 'high');
	if (highPrioritySuggestions.length > 0) return true;

	// Needs attention if way behind or stalled
	if (
		analysis.progressEvaluation.status === 'way_behind' ||
		analysis.progressEvaluation.status === 'stalled'
	) {
		return true;
	}

	// Needs attention if should pause
	if (analysis.recommendedAction === 'pause') return true;

	// Needs attention if complete (to mark as done)
	if (
		analysis.recommendedAction === 'celebrate' &&
		analysis.progressEvaluation.actualCompletion >= 100
	) {
		return true;
	}

	return false;
}

/**
 * Get color for progress visualization
 */
export function getAdaptationColor(analysis: AdaptiveGoalAnalysis): string {
	if (analysis.recommendedAction === 'pause') return '#ff4444';
	if (analysis.recommendedAction === 'celebrate') return '#3de8c8';

	switch (analysis.progressEvaluation.status) {
		case 'way_ahead':
			return '#3de8c8';
		case 'ahead':
			return '#3de8c8';
		case 'on_track':
			return '#f5a623';
		case 'behind':
			return '#ff6b3d';
		case 'way_behind':
			return '#ff4444';
		case 'stalled':
			return '#ff4444';
	}
}

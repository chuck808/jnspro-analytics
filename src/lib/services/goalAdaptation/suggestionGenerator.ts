/**
 * Suggestion Generator for Adaptive Goals
 *
 * Generates specific, actionable suggestions for goal adjustments
 * based on progress evaluation and performance data.
 */

import type { ProgressEvaluation } from './progressEvaluator';

export type AdjustmentType =
	| 'increase_target'
	| 'decrease_target'
	| 'extend_deadline'
	| 'shorten_deadline'
	| 'complete'
	| 'pause'
	| 'cancel';

export interface GoalAdjustmentSuggestion {
	type: AdjustmentType;
	priority: 'low' | 'medium' | 'high';
	title: string;
	description: string;
	currentValue: any;
	suggestedValue: any;
	rationale: string;
	confidence: number; // 0-1
	autoApply: boolean; // Can be auto-applied without confirmation
}

interface SuggestionContext {
	currentTarget: number;
	currentDeadline: Date;
	startValue: number;
	currentValue: number;
	lowerIsBetter: boolean;
	progressEvaluation: ProgressEvaluation;
	shouldRest: boolean; // From health check
	metric: string;
}

/**
 * Generate goal adjustment suggestions
 */
export function generateAdjustmentSuggestions(
	context: SuggestionContext
): GoalAdjustmentSuggestion[] {
	const suggestions: GoalAdjustmentSuggestion[] = [];

	// 1. Check if should pause due to health concerns.
	// Note: pause as an action is not yet implemented (no paused_at column in DB).
	// Instead, surface a rest advisory as an informational low-priority suggestion
	// so the rider sees the health concern without being offered a broken button.
	if (context.shouldRest) {
		suggestions.push({
			type: 'extend_deadline',
			priority: 'high',
			title: '⚠️ Recovery recommended',
			description:
				'Your recent session data suggests fatigue. Consider extending your deadline to give yourself more time rather than pushing harder right now.',
			currentValue: context.currentDeadline?.toLocaleDateString('en-GB') ?? 'No deadline',
			suggestedValue: 'Extended deadline',
			rationale: 'Continuing to chase the goal at pace when fatigued may slow overall progress.',
			confidence: 0.8,
			autoApply: false
		});
	}

	// 2. Check if goal is complete or nearly complete
	if (context.progressEvaluation.actualCompletion >= 100) {
		suggestions.push(generateCompleteSuggestion(context));
		return suggestions; // No other suggestions needed
	}

	if (context.progressEvaluation.actualCompletion >= 95) {
		suggestions.push(generateNearCompleteSuggestion(context));
	}

	// 3. Generate suggestions based on progress status
	switch (context.progressEvaluation.status) {
		case 'way_ahead':
			suggestions.push(...generateWayAheadSuggestions(context));
			break;
		case 'ahead':
			suggestions.push(...generateAheadSuggestions(context));
			break;
		case 'behind':
			suggestions.push(...generateBehindSuggestions(context));
			break;
		case 'way_behind':
			suggestions.push(...generateWayBehindSuggestions(context));
			break;
		case 'stalled':
			suggestions.push(...generateStalledSuggestions(context));
			break;
		// 'on_track' doesn't need suggestions
	}

	// Sort by priority
	return suggestions.sort((a, b) => {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		return priorityOrder[b.priority] - priorityOrder[a.priority];
	});
}

/**
 * Generate completion suggestion
 */
function generateCompleteSuggestion(context: SuggestionContext): GoalAdjustmentSuggestion {
	return {
		type: 'complete',
		priority: 'high',
		title: '🎉 Mark Goal as Complete!',
		description: `You've achieved your ${context.metric} goal!`,
		currentValue: context.currentTarget,
		suggestedValue: 'Completed',
		rationale: 'Target achieved - time to celebrate and set a new goal!',
		confidence: 1.0,
		autoApply: false
	};
}

/**
 * Generate near-completion suggestion
 */
function generateNearCompleteSuggestion(context: SuggestionContext): GoalAdjustmentSuggestion {
	return {
		type: 'complete',
		priority: 'medium',
		title: '🎯 Almost There!',
		description: "You're 95%+ complete. One more strong session should do it!",
		currentValue: context.currentTarget,
		suggestedValue: 'Ready to complete',
		rationale: 'Final push needed to cross the finish line',
		confidence: 0.8,
		autoApply: false
	};
}

/**
 * Suggestions for way ahead status
 */
function generateWayAheadSuggestions(context: SuggestionContext): GoalAdjustmentSuggestion[] {
	const suggestions: GoalAdjustmentSuggestion[] = [];

	// Suggest more ambitious target
	const remainingToTarget = Math.abs(context.currentTarget - context.currentValue);
	const newTarget = context.lowerIsBetter
		? context.currentTarget - remainingToTarget * 0.5 // Go 50% further
		: context.currentTarget + remainingToTarget * 0.5;

	suggestions.push({
		type: 'increase_target',
		priority: 'medium',
		title: '🚀 Set a Stretch Goal',
		description: `You're crushing it! Why not aim for ${formatValue(newTarget, context.metric)}?`,
		currentValue: context.currentTarget,
		suggestedValue: newTarget,
		rationale: `You're ${Math.abs(context.progressEvaluation.variance).toFixed(0)}% ahead of schedule. You have the momentum for a bigger challenge.`,
		confidence: 0.7,
		autoApply: false
	});

	// Suggest earlier deadline
	const daysToShorten = Math.floor(context.progressEvaluation.originalEstimate * 0.3);
	if (daysToShorten > 7) {
		const newDeadline = new Date(context.currentDeadline);
		newDeadline.setDate(newDeadline.getDate() - daysToShorten);

		suggestions.push({
			type: 'shorten_deadline',
			priority: 'low',
			title: '⏱️ Finish Early',
			description: `At your current pace, you could finish ${daysToShorten} days earlier`,
			currentValue: context.currentDeadline,
			suggestedValue: newDeadline,
			rationale: 'Shorten deadline to maintain momentum and start next goal sooner',
			confidence: 0.6,
			autoApply: false
		});
	}

	return suggestions;
}

/**
 * Suggestions for ahead status
 */
function generateAheadSuggestions(context: SuggestionContext): GoalAdjustmentSuggestion[] {
	const suggestions: GoalAdjustmentSuggestion[] = [];

	// Only suggest if more than halfway
	if (context.progressEvaluation.actualCompletion > 50) {
		const remainingToTarget = Math.abs(context.currentTarget - context.currentValue);
		const newTarget = context.lowerIsBetter
			? context.currentTarget - remainingToTarget * 0.3
			: context.currentTarget + remainingToTarget * 0.3;

		suggestions.push({
			type: 'increase_target',
			priority: 'low',
			title: '📈 Consider a Bigger Goal',
			description: `You're ahead of schedule. Consider targeting ${formatValue(newTarget, context.metric)}`,
			currentValue: context.currentTarget,
			suggestedValue: newTarget,
			rationale: 'Ahead of pace with good momentum',
			confidence: 0.6,
			autoApply: false
		});
	}

	return suggestions;
}

/**
 * Suggestions for behind status
 */
function generateBehindSuggestions(context: SuggestionContext): GoalAdjustmentSuggestion[] {
	const suggestions: GoalAdjustmentSuggestion[] = [];

	// Suggest deadline extension
	const daysToAdd = Math.floor(context.progressEvaluation.originalEstimate * 0.4);
	const newDeadline = new Date(context.currentDeadline);
	newDeadline.setDate(newDeadline.getDate() + daysToAdd);

	suggestions.push({
		type: 'extend_deadline',
		priority: 'medium',
		title: '📅 Extend Deadline',
		description: `Add ${daysToAdd} days to give yourself more time`,
		currentValue: context.currentDeadline,
		suggestedValue: newDeadline,
		rationale: 'Current pace suggests you need more time to reach your target without pressure',
		confidence: 0.7,
		autoApply: false
	});

	return suggestions;
}

/**
 * Suggestions for way behind status
 */
function generateWayBehindSuggestions(context: SuggestionContext): GoalAdjustmentSuggestion[] {
	const suggestions: GoalAdjustmentSuggestion[] = [];

	// Suggest more realistic target
	const progress = Math.abs(context.currentValue - context.startValue);
	const projectedFinal = context.lowerIsBetter
		? context.startValue - progress * 1.3 // Project 30% more improvement
		: context.startValue + progress * 1.3;

	suggestions.push({
		type: 'decrease_target',
		priority: 'high',
		title: '🎯 Adjust Target to Realistic Level',
		description: `Based on current progress, ${formatValue(projectedFinal, context.metric)} is more achievable`,
		currentValue: context.currentTarget,
		suggestedValue: projectedFinal,
		rationale:
			'Setting realistic goals maintains motivation. You can always set a new goal after achieving this one.',
		confidence: 0.8,
		autoApply: false
	});

	// Also suggest deadline extension
	const daysToAdd = Math.floor(context.progressEvaluation.originalEstimate * 0.6);
	const newDeadline = new Date(context.currentDeadline);
	newDeadline.setDate(newDeadline.getDate() + daysToAdd);

	suggestions.push({
		type: 'extend_deadline',
		priority: 'high',
		title: '📅 Significantly Extend Deadline',
		description: `Add ${daysToAdd} days to reduce pressure`,
		currentValue: context.currentDeadline,
		suggestedValue: newDeadline,
		rationale: 'More time will allow sustainable progress without risk of burnout',
		confidence: 0.8,
		autoApply: false
	});

	return suggestions;
}

/**
 * Suggestions for stalled status
 */
function generateStalledSuggestions(context: SuggestionContext): GoalAdjustmentSuggestion[] {
	const suggestions: GoalAdjustmentSuggestion[] = [];

	// Suggest reassessment
	suggestions.push({
		type: 'cancel',
		priority: 'medium',
		title: '🔄 Reassess This Goal',
		description: 'No progress detected. Consider if this goal is still relevant and achievable.',
		currentValue: 'Active',
		suggestedValue: 'Needs review',
		rationale:
			'Stalled goals can be demotivating. Either adjust the approach or set a different goal.',
		confidence: 0.7,
		autoApply: false
	});

	// Suggest more achievable target
	const easierTarget = context.lowerIsBetter
		? context.startValue - Math.abs(context.currentTarget - context.startValue) * 0.5
		: context.startValue + Math.abs(context.currentTarget - context.startValue) * 0.5;

	suggestions.push({
		type: 'decrease_target',
		priority: 'medium',
		title: '🎯 Set More Achievable Target',
		description: `Start with ${formatValue(easierTarget, context.metric)} to build momentum`,
		currentValue: context.currentTarget,
		suggestedValue: easierTarget,
		rationale: 'Smaller, achievable goals can help restart progress',
		confidence: 0.6,
		autoApply: false
	});

	return suggestions;
}

/**
 * Format value for display
 */
function formatValue(value: number, metric: string): string {
	const lowerMetric = metric.toLowerCase();

	if (lowerMetric.includes('reaction') || lowerMetric.includes('time')) {
		return `${(value / 1000).toFixed(3)}s`;
	}

	if (lowerMetric.includes('speed')) {
		return `${(value * 3.6).toFixed(1)} km/h`;
	}

	return value.toFixed(2);
}

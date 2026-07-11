/**
 * Performance Engine v8.1 — Cross-Session Messaging
 *
 * Builds conflict-aware headlines and explanations
 */

import type { CrossSessionReport, OverallTrend } from './types';

export interface CrossSessionMessaging {
	headline: string;
	summary: string;
	whyThisMatters: string;
	priority: 'high' | 'medium' | 'low';
}

export function buildCrossSessionMessaging(report: CrossSessionReport): CrossSessionMessaging {
	if (report.status === 'insufficient-data') {
		return {
			headline: 'Not enough data yet',
			summary: 'Log at least 3 sessions to unlock progress tracking and personalized insights.',
			whyThisMatters:
				'Consistent tracking helps identify patterns and optimize your training approach.',
			priority: 'low'
		};
	}

	// Confidence-aware prefix for headlines
	const confidencePrefix = getConfidencePrefix(report.confidence, report.lookbackSessions);

	// Detect conflicts for conflict-aware headlines
	const hasSpeedImprovement = report.performance.speedTrend.improving;
	const hasConsistencyDecline =
		!report.consistency.repeatabilityTrend.improving &&
		report.consistency.repeatabilityTrend.direction !== 'stable';
	const hasFatigueIssue =
		!report.fatigue.optimalSetLengthTrend.improving &&
		report.fatigue.optimalSetLengthTrend.direction === 'down';
	const hasReactionDecline =
		report.performance.reactionTrend.direction === 'up' &&
		!report.performance.reactionTrend.improving;
	const bestImproving = report.performance.reactionTrend.improving; // Best reaction times getting faster
	const avgDeclining = report.consistency.repeatabilityTrend.direction === 'down'; // Average performance declining

	// Conflict-aware headline generation
	let headline: string;
	let priority: 'high' | 'medium' | 'low' = 'medium';

	if (bestImproving && avgDeclining) {
		headline =
			confidencePrefix +
			'Mixed performance — peak runs improving but average performance declining';
		priority = 'high';
	} else if (hasSpeedImprovement && hasConsistencyDecline) {
		headline = confidencePrefix + 'Speed improving, but consistency declining';
		priority = report.confidence === 'low' ? 'medium' : 'high';
	} else if (hasSpeedImprovement && hasFatigueIssue) {
		headline = confidencePrefix + 'Speed improving, but fatigue appearing earlier';
		priority = report.confidence === 'low' ? 'medium' : 'high';
	} else if (hasSpeedImprovement && hasReactionDecline) {
		headline = confidencePrefix + 'Speed improving, but reactions slowing';
		priority = 'medium';
	} else if (report.overallTrend === 'improving') {
		const speedChange = report.performance.speedTrend.change;
		if (speedChange !== null && speedChange > 0) {
			headline =
				confidencePrefix +
				`Speed improving with stable execution (+${speedChange.toFixed(1)} km/h)`;
		} else {
			headline = confidencePrefix + 'Performance improving across sessions';
		}
		priority = 'low';
	} else if (report.overallTrend === 'declining') {
		headline = confidencePrefix + 'Multiple metrics trending down';
		priority = report.confidence === 'low' ? 'medium' : 'high';
	} else if (report.overallTrend === 'mixed') {
		headline = confidencePrefix + 'Mixed progress across different areas';
		priority = 'medium';
	} else {
		headline = confidencePrefix + 'Performance stable across recent sessions';
		priority = 'low';
	}

	// Generate summary
	const summary = buildSummary(report);

	// Generate "why this matters" explanation
	const whyThisMatters = buildWhyThisMatters(
		report,
		hasSpeedImprovement,
		hasConsistencyDecline,
		hasFatigueIssue,
		bestImproving,
		avgDeclining
	);

	return {
		headline,
		summary,
		whyThisMatters,
		priority
	};
}

function buildSummary(report: CrossSessionReport): string {
	const summaryParts: string[] = [];

	// Performance summary
	if (report.performance.speedTrend.improving) {
		summaryParts.push('speed is up');
	} else if (report.performance.speedTrend.direction === 'down') {
		summaryParts.push('speed is declining');
	}

	if (report.performance.reactionTrend.improving) {
		summaryParts.push('reactions are faster');
	} else if (
		!report.performance.reactionTrend.improving &&
		report.performance.reactionTrend.direction !== 'stable'
	) {
		summaryParts.push('reactions are slower');
	}

	// Consistency summary
	if (report.consistency.repeatabilityTrend.improving) {
		summaryParts.push('consistency is improving');
	} else if (
		!report.consistency.repeatabilityTrend.improving &&
		report.consistency.repeatabilityTrend.direction !== 'stable'
	) {
		summaryParts.push('consistency is declining');
	}

	// Fatigue summary
	if (report.fatigue.optimalSetLengthTrend.improving) {
		summaryParts.push('work capacity is increasing');
	} else if (
		!report.fatigue.optimalSetLengthTrend.improving &&
		report.fatigue.optimalSetLengthTrend.direction === 'down'
	) {
		summaryParts.push('work capacity is decreasing');
	}

	if (summaryParts.length === 0) {
		return 'Performance metrics are holding steady across recent sessions.';
	}

	// Join parts with proper grammar
	if (summaryParts.length === 1) {
		return `Over your last ${report.lookbackSessions} sessions, ${summaryParts[0]}.`;
	} else if (summaryParts.length === 2) {
		return `Over your last ${report.lookbackSessions} sessions, ${summaryParts[0]} and ${summaryParts[1]}.`;
	} else {
		const lastPart = summaryParts.pop();
		return `Over your last ${report.lookbackSessions} sessions, ${summaryParts.join(', ')}, and ${lastPart}.`;
	}
}

function buildWhyThisMatters(
	report: CrossSessionReport,
	hasSpeedImprovement: boolean,
	hasConsistencyDecline: boolean,
	hasFatigueIssue: boolean,
	bestImproving: boolean,
	avgDeclining: boolean
): string {
	// Conflict-specific explanations
	if (bestImproving && avgDeclining) {
		return 'Your best runs are getting better, but your average performance is slipping. This suggests inconsistent execution—focus on repeating your best technique across all runs, not just chasing peak performances.';
	}

	if (hasSpeedImprovement && hasConsistencyDecline) {
		return 'While getting faster is great, declining consistency suggests you may be pushing for peak performance at the expense of repeatable execution. Sustainable progress requires both.';
	}

	if (hasSpeedImprovement && hasFatigueIssue) {
		return 'Increasing speed while reducing session capacity suggests you may be underrecovering. Your body needs adequate rest to adapt to higher intensity work.';
	}

	if (report.overallTrend === 'improving') {
		return 'Consistent improvement across multiple metrics indicates your training approach is working. Keep tracking to ensure progress continues.';
	}

	if (report.overallTrend === 'declining') {
		return 'Declining performance across multiple areas is a signal to review your training load, recovery, and technique. Small adjustments now prevent bigger setbacks later.';
	}

	if (report.overallTrend === 'mixed') {
		return 'Mixed results often indicate trade-offs in training focus. Understanding which metrics matter most for your goals helps prioritize your approach.';
	}

	return "Stable performance shows you're maintaining your current level. If you want to progress, consider adjusting training volume or intensity.";
}

/**
 * Get confidence-aware prefix for headlines based on data quantity
 */
function getConfidencePrefix(
	confidence: 'low' | 'moderate' | 'high',
	lookbackSessions: number
): string {
	if (confidence === 'low' || lookbackSessions < 5) {
		return 'Early signal — ';
	}
	if (confidence === 'moderate' || lookbackSessions < 10) {
		return 'Trend developing — ';
	}
	// High confidence (10+ sessions)
	return '';
}

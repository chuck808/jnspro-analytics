/**
 * v8.2 Truth Rules
 *
 * Prevents contradictory coaching output by applying priority-based logic.
 * Warnings and mixed signals override positive messaging.
 *
 * Core Rule: If there is a problem, do not say everything is excellent.
 */

import type { CrossSessionReport } from './types';

export interface TruthRuleResult {
	overrideHeadline?: string;
	overrideRecommendations?: string[];
	reason: string;
	priority: number;
}

/**
 * Apply truth rules to a cross-session report
 * Returns the original report with potentially overridden fields
 */
export function applyTruthRulesToReport(
	report: CrossSessionReport | null
): CrossSessionReport | null {
	if (!report) return null;

	const truth = applyCrossSessionTruthRules(report);

	if (!truth) return report;

	// Apply overrides
	return {
		...report,
		headline: truth.overrideHeadline ?? report.headline,
		recommendations: truth.overrideRecommendations ?? report.recommendations
	};
}

/**
 * Evaluate a cross-session report and return truth rule result if override needed
 */
export function applyCrossSessionTruthRules(report: CrossSessionReport): TruthRuleResult | null {
	// Check for mixed trends first (before low confidence check)
	const speedImproving = report.performance.speedTrend.improving;
	const reactionImproving = report.performance.reactionTrend.improving;
	const repeatabilityDeclining = report.consistency.repeatabilityTrend.direction === 'down';
	const gapWidening = report.consistency.bestVsAverageGapTrend.direction === 'up';

	// Priority 1: Early signal of mixed trends (even with low confidence)
	if ((speedImproving || reactionImproving) && (repeatabilityDeclining || gapWidening)) {
		// Low confidence version - acknowledge the pattern but flag data limitation
		if (report.confidence === 'low') {
			return {
				overrideHeadline: 'Early signal — speed improving but capacity needs watching',
				overrideRecommendations: [
					'Keep logging sessions to build confidence in this pattern.',
					'Watch whether speed gains are maintained across full sets.',
					'If the pattern persists, address capacity before chasing more speed.'
				],
				reason: 'Early detection of mixed trend pattern with low confidence',
				priority: 1
			};
		}

		// Higher confidence version
		return {
			overrideHeadline: 'Mixed performance — peaks improving but consistency declining',
			overrideRecommendations: [
				'Peak outputs are rising, but repeatability is suffering.',
				'Focus on consistent execution over peak performance.',
				'Repeatable technique builds sustainable progress.'
			],
			reason: 'Improving peaks with declining consistency indicates unsustainable approach',
			priority: 2
		};
	}

	// Priority 2: Low confidence without mixed signals - early signal mode
	if (report.confidence === 'low') {
		return {
			overrideHeadline: 'Early trend signal — more sessions needed',
			overrideRecommendations: [
				'Keep logging sessions to build confidence in trend analysis.',
				'Initial patterns are detectable but need more data to confirm.'
			],
			reason: 'Low confidence prevents definitive conclusions',
			priority: 2
		};
	}

	// Priority 3: Any major decline. Reaction time is lower-is-better, so an
	// upward reaction trend is the worsening direction; the other metrics here
	// are higher-is-better.
	const hasDecline =
		report.performance.speedTrend.direction === 'down' ||
		report.performance.reactionTrend.direction === 'up' ||
		report.performance.peakGTrend.direction === 'down' ||
		repeatabilityDeclining;

	if (hasDecline) {
		const decliningMetrics: string[] = [];
		if (report.performance.speedTrend.direction === 'down') decliningMetrics.push('speed');
		if (report.performance.reactionTrend.direction === 'up')
			decliningMetrics.push('reaction time');
		if (report.performance.peakGTrend.direction === 'down') decliningMetrics.push('power');
		if (repeatabilityDeclining) decliningMetrics.push('consistency');

		return {
			overrideHeadline: `Performance declining — ${decliningMetrics.join(', ')} trending down`,
			overrideRecommendations: [
				'Multiple metrics are moving in the wrong direction.',
				'Consider recovery, form check, or training load adjustment.',
				'Do not push harder when declining — investigate the cause.'
			],
			reason: `Declining metrics: ${decliningMetrics.join(', ')}`,
			priority: 3
		};
	}

	// Priority 4: Contradictory messaging
	const hasWarning = report.warnings && report.warnings.length > 0;
	const hasPositiveHeadline =
		report.headline.toLowerCase().includes('excellent') ||
		report.headline.toLowerCase().includes('strong progress');

	if (hasWarning && hasPositiveHeadline) {
		return {
			overrideHeadline: 'Progress with areas to watch',
			overrideRecommendations: report.recommendations.filter(
				(r: string) =>
					r.toLowerCase().includes('address') ||
					r.toLowerCase().includes('watch') ||
					r.toLowerCase().includes('caution')
			),
			reason: 'Prevent contradictory positive message when warnings exist',
			priority: 4
		};
	}

	// No override needed - original report is truthful
	return null;
}

/**
 * Check if a report has contradictory messaging
 * Returns reason if contradiction found, null otherwise
 */
export function detectContradiction(report: CrossSessionReport): string | null {
	const hasWarning = report.warnings && report.warnings.length > 0;

	const hasPositiveHeadline =
		report.headline.toLowerCase().includes('excellent') ||
		report.headline.toLowerCase().includes('strong progress') ||
		report.headline.toLowerCase().includes('maintain current approach');

	if (hasWarning && hasPositiveHeadline) {
		return 'Report contains warnings but positive overall message - truth rules should override';
	}

	return null;
}
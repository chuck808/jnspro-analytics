/**
 * Performance Engine Presentation Bridge
 *
 * UPDATED: Post-migration to Performance Engine unified output
 *
 * This module now simply enhances Performance Engine output with
 * presentation-layer formatting. All analytics computations now happen
 * in the Performance Engine.
 *
 * Migration Status:
 * - Phase 1: Legacy features migrated to Performance Engine ✅
 * - Phase 2: Session Intelligence integrated ✅
 * - Phase 3: Bridge simplified to presentation only ✅
 *
 * Purpose:
 * - Add presentation metadata (formula references, summaries)
 * - Maintain backward compatibility during transition
 * - NO computation - pure presentation layer
 */

import type {
	SessionAnalysis,
	Recommendation,
	WeaknessAnalysis
} from '$lib/performance-engine/types';

/**
 * @deprecated Legacy input no longer needed - Performance Engine provides all metrics
 * Kept for backward compatibility during transition
 */
export interface LegacyMetricsInput {
	techniqueScores?: any;
	jerkProfile?: any;
	phaseMetrics?: any;
	speedProfile?: string;
	dataQuality?: string;
	consistency?: any;
}

export interface EnhancedSessionAnalysis extends SessionAnalysis {
	legacyIntegration: {
		speedProfile: string;
		dataQuality: string;
		combinedWeaknesses: WeaknessAnalysis[];
		combinedRecommendations: Recommendation[];
		formulaReferences: string[];
	};
}

/**
 * Enhances Performance Engine analysis with presentation-layer metadata
 *
 * UPDATED: Now extracts all data from Performance Engine output
 * Legacy metrics parameter is deprecated but kept for backward compatibility
 */
export function integrateWithPerformanceEngine(
	performanceAnalysis: SessionAnalysis,
	_legacyMetrics?: LegacyMetricsInput
): EnhancedSessionAnalysis {
	// Extract speed profile and data quality from Performance Engine output
	const speedProfile = performanceAnalysis.selectedRun?.physics?.speedProfile ?? '—';
	const dataQuality = performanceAnalysis.selectedRun?.physics?.dataQuality?.label ?? 'Unknown';

	// Performance Engine already has comprehensive weaknesses
	const combinedWeaknesses = performanceAnalysis.weaknesses;

	// Performance Engine already has comprehensive recommendations
	const combinedRecommendations = performanceAnalysis.recommendations;

	// Track which formulas are active (now from Performance Engine)
	const formulaReferences = identifyActiveFormulasFromEngine(performanceAnalysis);

	return {
		...performanceAnalysis,
		weaknesses: combinedWeaknesses,
		recommendations: combinedRecommendations,
		legacyIntegration: {
			speedProfile,
			dataQuality,
			combinedWeaknesses,
			combinedRecommendations,
			formulaReferences
		}
	};
}

/**
 * Identifies which analytical formulas are active from Performance Engine output
 * UPDATED: Now tracks Performance Engine formulas instead of legacy
 */
function identifyActiveFormulasFromEngine(analysis: SessionAnalysis): string[] {
	const formulas: string[] = ['Performance Engine Core'];

	if (analysis.selectedRun?.physics) {
		formulas.push('computeSpeedCurve - performance-engine/physics.ts');

		if (analysis.selectedRun.physics.speedSplits?.length) {
			formulas.push('calculateSpeedSplits - performance-engine/physics.ts');
		}

		if (analysis.selectedRun.physics.speedProfile) {
			formulas.push('classifySpeedProfile - performance-engine/physics.ts');
		}

		if (analysis.selectedRun.physics.jerk) {
			formulas.push('computeJerk - performance-engine/physics.ts');
		}

		if (analysis.selectedRun.physics.power) {
			formulas.push('estimatePower - performance-engine/physics.ts');
		}

		if (analysis.selectedRun.physics.impulse) {
			formulas.push('analyseImpulse - performance-engine/physics.ts');
		}

		if (analysis.selectedRun.physics.dataQuality) {
			formulas.push('assessDataQuality - performance-engine/dataQuality.ts');
		}
	}

	if (analysis.selectedRun?.technique) {
		formulas.push('scoreTechnique - performance-engine/technique.ts');
	}

	if (analysis.summary.consistencyScore !== null) {
		formulas.push('scoreConsistency - performance-engine/technique.ts');
	}

	if (analysis.intelligence) {
		formulas.push('Session Intelligence:');
		if (analysis.intelligence.bestVsAvg) {
			formulas.push('analyseBestVsAverage - performance-engine/bestVsAverage.ts');
		}
		if (analysis.intelligence.dropOff) {
			formulas.push('detectDropOff - performance-engine/dropoff.ts');
		}
		formulas.push('suggestSetLength - performance-engine/setLength.ts');
	}

	return formulas;
}

/**
 * Creates a comprehensive insight summary that combines PE and legacy insights
 */
export function createUnifiedInsightSummary(enhanced: EnhancedSessionAnalysis): string {
	const parts: string[] = [];

	// Performance Engine headline
	parts.push('Performance Analysis:');

	// Add speed profile context
	if (enhanced.legacyIntegration.speedProfile) {
		parts.push(`Speed Profile: ${enhanced.legacyIntegration.speedProfile}`);
	}

	// Add data quality context
	if (enhanced.legacyIntegration.dataQuality) {
		parts.push(`Data Quality: ${enhanced.legacyIntegration.dataQuality}`);
	}

	// Add weakness count
	if (enhanced.legacyIntegration.combinedWeaknesses.length > 0) {
		parts.push(
			`Focus Areas: ${enhanced.legacyIntegration.combinedWeaknesses.length} areas identified`
		);
	}

	// Add top recommendation
	if (enhanced.legacyIntegration.combinedRecommendations.length > 0) {
		const topRec = enhanced.legacyIntegration.combinedRecommendations[0];
		parts.push(`Priority: ${topRec.title}`);
	}

	return parts.join(' | ');
}

/**
 * Helper to convert Performance Engine session analysis into format usable by analyticsExtended
 * Enables PE data to enhance legacy weakness/recommendation identification
 */
export function extractPerformanceEngineDataForLegacy(analysis: SessionAnalysis) {
	return {
		techniqueAnalysis: analysis.selectedRun?.technique ?? null,
		weaknesses: analysis.weaknesses,
		physics: analysis.selectedRun?.physics ?? null
	};
}

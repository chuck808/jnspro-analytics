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
	legacyMetrics?: LegacyMetricsInput
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
 * Combines weakness detection from Performance Engine and legacy technique scores
 * Now leverages enhanced analyticsExtended.identifyWeaknesses with PE integration
 */
function combineWeaknesses(
	peWeaknesses: WeaknessAnalysis[],
	legacy: LegacyMetricsInput
): WeaknessAnalysis[] {
	// Performance Engine weaknesses are already comprehensive
	// Legacy jerk/phase analysis adds additional detail
	const combined = [...peWeaknesses];
	const existingAreas = new Set(peWeaknesses.map((w) => w.area.toLowerCase()));

	// Add jerk-based smoothness weakness if not already covered
	if (legacy.jerkProfile && legacy.jerkProfile.smoothnessScore < 65) {
		if (!existingAreas.has('smoothness') && !existingAreas.has('force application')) {
			combined.push({
				area: 'Force Application Smoothness',
				score: legacy.jerkProfile.smoothnessScore,
				advice: [
					'Focus on progressive force application through the first 3 pedal strokes.',
					`Current jerk smoothness: ${Math.round(legacy.jerkProfile.smoothnessScore)}/100`,
					'Avoid sudden spikes or jerky movements in the first meter.'
				]
			});
		}
	}

	// Add phase-specific weaknesses from detailed phase analysis
	if (legacy.phaseMetrics) {
		if (legacy.phaseMetrics.drivePhase.efficiency < 0.7) {
			if (!existingAreas.has('drive phase') && !existingAreas.has('drive')) {
				combined.push({
					area: 'Drive Phase Efficiency',
					score: Math.round(legacy.phaseMetrics.drivePhase.efficiency * 100),
					advice: [
						'Improve initial power delivery in the first 0.5-1.0 seconds.',
						'Focus on maximum force application during the gate snap.',
						'Check body position and weight transfer timing.'
					]
				});
			}
		}

		if (legacy.phaseMetrics.transitionPhase.transitionEfficiency < 0.65) {
			if (!existingAreas.has('transition')) {
				combined.push({
					area: 'Transition Phase',
					score: Math.round(legacy.phaseMetrics.transitionPhase.transitionEfficiency * 100),
					advice: [
						'Smooth the transition from drive to velocity phase.',
						'Maintain pedal cadence through the mid-acceleration zone.',
						'Avoid power drop-off between initial snap and top speed.'
					]
				});
			}
		}
	}

	// Add data quality concerns
	if (legacy.dataQuality === 'Poor' || legacy.dataQuality === 'Fair') {
		if (!existingAreas.has('data quality')) {
			combined.push({
				area: 'Data Quality',
				score: legacy.dataQuality === 'Poor' ? 25 : 50,
				advice: [
					`Current data quality: ${legacy.dataQuality}`,
					'Consider recalibrating IMU sensors for more accurate speed estimates.',
					'High-quality data enables more precise performance insights.'
				]
			});
		}
	}

	return combined;
}

/**
 * Generates structured recommendations from legacy technique scores and metrics
 */
function generateLegacyRecommendations(legacy: LegacyMetricsInput): Recommendation[] {
	const recommendations: Recommendation[] = [];

	// Speed profile-based recommendations
	if (legacy.speedProfile === 'Late Peak') {
		recommendations.push({
			priority: 'medium',
			title: 'Shift peak power earlier',
			message:
				'Your speed profile shows a late peak. Focus on explosive first pedal strokes to achieve peak acceleration sooner.',
			metric: 'speed_profile'
		});
	} else if (legacy.speedProfile === 'Early Peak') {
		recommendations.push({
			priority: 'low',
			title: 'Maintain power through transition',
			message:
				'Strong early acceleration detected. Work on maintaining power as you transition to top speed.',
			metric: 'speed_profile'
		});
	}

	// Jerk-based recommendations
	if (legacy.jerkProfile) {
		if (legacy.jerkProfile.meanAbsolute > 50) {
			recommendations.push({
				priority: 'medium',
				title: 'Reduce force application variance',
				message:
					'High jerk values suggest uneven force application. Focus on smooth, progressive power delivery.',
				metric: 'jerk'
			});
		}

		if (legacy.jerkProfile.smoothnessScore < 60) {
			recommendations.push({
				priority: 'high',
				title: 'Improve force smoothness',
				message: `Smoothness score: ${Math.round(legacy.jerkProfile.smoothnessScore)}/100. Work on eliminating jerky movements in the first meter.`,
				metric: 'smoothness'
			});
		}
	}

	// Phase-based recommendations
	if (legacy.phaseMetrics) {
		const { drivePhase, transitionPhase, velocityPhase } = legacy.phaseMetrics;

		if (drivePhase.efficiency < 70) {
			recommendations.push({
				priority: 'high',
				title: 'Optimize drive phase',
				message: `Drive efficiency: ${Math.round(drivePhase.efficiency)}/100. Focus on maximum force in the first ${drivePhase.durationS.toFixed(2)}s.`,
				metric: 'drive_phase'
			});
		}

		if (transitionPhase.transitionEfficiency < 65) {
			recommendations.push({
				priority: 'medium',
				title: 'Smooth transition phase',
				message: `Transition efficiency: ${Math.round(transitionPhase.transitionEfficiency)}/100. Maintain cadence through mid-acceleration.`,
				metric: 'transition_phase'
			});
		}

		if (velocityPhase.maintenanceScore < 70) {
			recommendations.push({
				priority: 'low',
				title: 'Maintain top speed',
				message: 'Work on holding peak velocity longer through the timing gates.',
				metric: 'velocity_phase'
			});
		}
	}

	// Technique score-based recommendations
	if (legacy.techniqueScores) {
		const { reaction, explosiveness, smoothness, efficiency } = legacy.techniqueScores;

		if (reaction !== null && reaction < 65) {
			recommendations.push({
				priority: 'high',
				title: 'Improve reaction time',
				message: `Reaction score: ${Math.round(reaction)}/100. Develop a consistent pre-gate routine and practice reacting vs. predicting.`,
				metric: 'reaction'
			});
		}

		if (explosiveness !== null && explosiveness < 65) {
			recommendations.push({
				priority: 'high',
				title: 'Increase explosiveness',
				message: `Explosiveness: ${Math.round(explosiveness)}/100. Focus on maximal force in the first 3 pedal strokes.`,
				metric: 'explosiveness'
			});
		}

		if (efficiency !== null && efficiency < 65) {
			recommendations.push({
				priority: 'medium',
				title: 'Improve power efficiency',
				message: `Efficiency: ${Math.round(efficiency)}/100. Work on converting force into forward speed more effectively.`,
				metric: 'efficiency'
			});
		}
	}

	return recommendations;
}

/**
 * Merges and de-duplicates recommendations from Performance Engine and legacy systems
 * Prioritizes based on severity and removes redundant advice
 */
function mergeRecommendations(
	peRecommendations: Recommendation[],
	legacyRecommendations: Recommendation[]
): Recommendation[] {
	const merged = [...peRecommendations];
	const existingMetrics = new Set(peRecommendations.map((r) => r.metric).filter(Boolean));

	// Add legacy recommendations that don't duplicate PE recommendations
	for (const legacyRec of legacyRecommendations) {
		if (!legacyRec.metric || !existingMetrics.has(legacyRec.metric)) {
			merged.push(legacyRec);
		}
	}

	// Sort by priority: high → medium → low
	const priorityOrder = { high: 0, medium: 1, low: 2 };
	merged.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

	// Limit to top 6 recommendations to avoid overwhelming users
	return merged.slice(0, 6);
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
 * @deprecated Use identifyActiveFormulasFromEngine instead
 * Kept for backward compatibility only
 */
function identifyActiveFormulas(legacy: LegacyMetricsInput): string[] {
	const formulas: string[] = [];

	if (legacy.techniqueScores) {
		formulas.push('scoreTechnique', 'analytics.ts:lines_58-59');
	}

	if (legacy.jerkProfile) {
		formulas.push('computeJerk', 'analyticsExtended.ts:lines_69');
	}

	if (legacy.phaseMetrics) {
		formulas.push('computeDetailedPhases', 'analyticsExtended.ts:lines_70');
	}

	formulas.push('computeSpeedCurve', 'analytics.ts:lines_51');
	formulas.push('classifySpeedProfile', 'analytics.ts:lines_55');

	if (legacy.consistency) {
		formulas.push('scoreConsistency', 'analytics.ts:lines_95');
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

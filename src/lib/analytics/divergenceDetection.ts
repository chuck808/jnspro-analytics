/**
 * Divergence Detection for Multi-Run Comparison
 *
 * Detects significant differences between runs to help athletes identify
 * where technique or performance varies across attempts.
 */

export interface DivergencePoint {
	/** Index in the time series */
	index: number;
	/** Time in seconds */
	timeS: number;
	/** Percentage difference between runs */
	percentDiff: number;
	/** Value from run 1 */
	run1Value: number;
	/** Value from run 2 */
	run2Value: number;
	/** Average value at this point */
	avgValue: number;
	/** Severity level */
	severity: 'minor' | 'moderate' | 'major';
}

export interface DivergenceAnalysis {
	/** All detected divergence points */
	points: DivergencePoint[];
	/** Overall similarity score (0-100, higher = more similar) */
	similarityScore: number;
	/** Phase where most divergence occurs */
	divergentPhase: 'early' | 'mid' | 'late' | 'consistent';
	/** Summary insight */
	insight: string;
}

/**
 * Detect divergence between two runs
 */
export function detectDivergence(
	run1Data: number[],
	run2Data: number[],
	elapsedMs: number,
	threshold: number = 15 // 15% difference triggers detection
): DivergenceAnalysis {
	const divergencePoints: DivergencePoint[] = [];
	const minLength = Math.min(run1Data.length, run2Data.length);

	// Calculate time per sample
	const timePerSample = elapsedMs / 1000 / (minLength > 1 ? minLength - 1 : 1);

	for (let i = 0; i < minLength; i++) {
		const diff = Math.abs(run1Data[i] - run2Data[i]);
		const avg = (run1Data[i] + run2Data[i]) / 2;
		const percentDiff = avg > 0 ? (diff / avg) * 100 : 0;

		if (percentDiff > threshold && avg > 0.1) {
			// Ignore noise near zero
			const severity: 'minor' | 'moderate' | 'major' =
				percentDiff > 40 ? 'major' : percentDiff > 25 ? 'moderate' : 'minor';

			divergencePoints.push({
				index: i,
				timeS: i * timePerSample,
				percentDiff,
				run1Value: run1Data[i],
				run2Value: run2Data[i],
				avgValue: avg,
				severity
			});
		}
	}

	// Calculate similarity score (100 = identical, 0 = completely different)
	const avgPercentDiff =
		divergencePoints.length > 0
			? divergencePoints.reduce((sum, p) => sum + p.percentDiff, 0) / divergencePoints.length
			: 0;
	const similarityScore = Math.max(0, Math.min(100, 100 - avgPercentDiff));

	// Determine which phase has most divergence
	const divergentPhase = determineDivergentPhase(divergencePoints, minLength);

	// Generate insight
	const insight = generateDivergenceInsight(divergencePoints, similarityScore, divergentPhase);

	return {
		points: divergencePoints,
		similarityScore,
		divergentPhase,
		insight
	};
}

/**
 * Detect divergence across multiple runs (3-4 runs)
 */
export function detectMultiRunDivergence(
	runs: Array<{ data: number[]; label: string }>,
	elapsedMs: number
): {
	pairwiseAnalysis: Array<{
		run1: string;
		run2: string;
		analysis: DivergenceAnalysis;
	}>;
	consistencyScore: number;
	insight: string;
} {
	const pairwiseAnalysis: Array<{
		run1: string;
		run2: string;
		analysis: DivergenceAnalysis;
	}> = [];

	// Compare all pairs
	for (let i = 0; i < runs.length; i++) {
		for (let j = i + 1; j < runs.length; j++) {
			const analysis = detectDivergence(runs[i].data, runs[j].data, elapsedMs);

			pairwiseAnalysis.push({
				run1: runs[i].label,
				run2: runs[j].label,
				analysis
			});
		}
	}

	// Overall consistency score (average of all pairwise similarities)
	const consistencyScore =
		pairwiseAnalysis.length > 0
			? pairwiseAnalysis.reduce((sum, pa) => sum + pa.analysis.similarityScore, 0) /
				pairwiseAnalysis.length
			: 100;

	// Generate multi-run insight
	const insight = generateMultiRunInsight(consistencyScore, pairwiseAnalysis);

	return {
		pairwiseAnalysis,
		consistencyScore,
		insight
	};
}

/**
 * Determine which phase of the run has the most divergence
 */
function determineDivergentPhase(
	points: DivergencePoint[],
	totalLength: number
): 'early' | 'mid' | 'late' | 'consistent' {
	if (points.length === 0) return 'consistent';

	const earlyThreshold = totalLength * 0.33;
	const lateThreshold = totalLength * 0.67;

	const earlyPoints = points.filter((p) => p.index < earlyThreshold);
	const midPoints = points.filter((p) => p.index >= earlyThreshold && p.index < lateThreshold);
	const latePoints = points.filter((p) => p.index >= lateThreshold);

	if (earlyPoints.length > midPoints.length && earlyPoints.length > latePoints.length) {
		return 'early';
	}
	if (latePoints.length > midPoints.length && latePoints.length > earlyPoints.length) {
		return 'late';
	}
	if (midPoints.length > 0) {
		return 'mid';
	}
	return 'consistent';
}

/**
 * Generate insight text for divergence analysis
 */
function generateDivergenceInsight(
	points: DivergencePoint[],
	similarityScore: number,
	phase: 'early' | 'mid' | 'late' | 'consistent'
): string {
	if (similarityScore >= 90) {
		return 'These runs are very similar — excellent consistency in technique and execution.';
	}

	if (similarityScore >= 75) {
		return `Good consistency overall. ${getPhaseInsight(phase, 'minor')}`;
	}

	if (similarityScore >= 60) {
		return `Moderate variation between runs. ${getPhaseInsight(phase, 'moderate')}`;
	}

	if (similarityScore >= 40) {
		return `Significant differences detected. ${getPhaseInsight(phase, 'major')}`;
	}

	return `These runs are quite different. ${getPhaseInsight(phase, 'major')} Review technique and conditions.`;
}

/**
 * Get phase-specific insight
 */
function getPhaseInsight(
	phase: 'early' | 'mid' | 'late' | 'consistent',
	severity: 'minor' | 'moderate' | 'major'
): string {
	switch (phase) {
		case 'early':
			return severity === 'major'
				? 'Major variation in the start/reaction phase — focus on consistency at the gate.'
				: 'Some variation in the initial acceleration phase.';
		case 'mid':
			return severity === 'major'
				? 'Significant differences in the mid-phase — check transition technique.'
				: 'Slight variation in the transition phase.';
		case 'late':
			return severity === 'major'
				? 'Late-phase divergence detected — may indicate fatigue or speed carry differences.'
				: 'Minor variation in the speed maintenance phase.';
		case 'consistent':
			return 'Variation is evenly distributed across the run.';
	}
}

/**
 * Generate insight for multi-run comparison
 */
function generateMultiRunInsight(
	consistencyScore: number,
	pairwiseAnalysis: Array<{ run1: string; run2: string; analysis: DivergenceAnalysis }>
): string {
	if (consistencyScore >= 85) {
		return '🎯 Excellent consistency across all runs — this is the goal!';
	}

	if (consistencyScore >= 70) {
		return '✅ Good overall consistency. Minor variations are normal and expected.';
	}

	if (consistencyScore >= 55) {
		return '⚠️ Moderate variation across runs. Look for patterns in what changed between attempts.';
	}

	// Find the most divergent pair
	const mostDivergent = pairwiseAnalysis.reduce((max, pa) =>
		pa.analysis.similarityScore < max.analysis.similarityScore ? pa : max
	);

	return `🔍 Significant variation detected. ${mostDivergent.run1} and ${mostDivergent.run2} show the most difference (${mostDivergent.analysis.divergentPhase} phase).`;
}

/**
 * Calculate cross-correlation to find time offset between runs
 * (Advanced: Detects if runs are similar but offset in time)
 */
export function calculateTimeOffset(
	run1Data: number[],
	run2Data: number[],
	maxOffsetSamples: number = 10
): {
	offsetSamples: number;
	correlation: number;
} {
	let bestOffset = 0;
	let bestCorrelation = -1;

	for (let offset = -maxOffsetSamples; offset <= maxOffsetSamples; offset++) {
		let correlation = 0;
		let count = 0;

		for (let i = 0; i < run1Data.length; i++) {
			const j = i + offset;
			if (j >= 0 && j < run2Data.length) {
				correlation += run1Data[i] * run2Data[j];
				count++;
			}
		}

		if (count > 0) {
			correlation /= count;
			if (correlation > bestCorrelation) {
				bestCorrelation = correlation;
				bestOffset = offset;
			}
		}
	}

	return {
		offsetSamples: bestOffset,
		correlation: bestCorrelation
	};
}

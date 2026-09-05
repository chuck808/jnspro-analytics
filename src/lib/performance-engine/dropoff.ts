/**
 * Drop-off Detection (KEY FEATURE)
 *
 * Finds where performance starts to fall apart.
 * Detects when performance drops >6% from best-so-far.
 */

export interface DropOffAnalysis {
	dropOffRun: number;
	dropPercent: number;
}

export function detectDropOff(values: number[], runNumbers?: number[]): DropOffAnalysis | null {
	if (values.length < 4) return null;

	let bestSoFar = -Infinity;

	for (let i = 0; i < values.length; i++) {
		bestSoFar = Math.max(bestSoFar, values[i]);

		// Detect if current value drops >6% below best-so-far
		if (i > 1 && values[i] < bestSoFar * 0.94) {
			return {
				dropOffRun: runNumbers?.[i] ?? i + 1,
				dropPercent: ((bestSoFar - values[i]) / bestSoFar) * 100
			};
		}
	}

	return null;
}

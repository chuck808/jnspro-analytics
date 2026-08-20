export interface ProgressSessionAnalysis {
	sessionId: string;
	timestamp: string;
	techniqueScores?: {
		overall?: number | null;
		smoothness?: number | null;
	} | null;
	analysis?: {
		selectedRun?: {
			physics?: {
				power?: {
					averageW?: number | null;
					peakW?: number | null;
				} | null;
			} | null;
		} | null;
	} | null;
}

export interface ProgressRunEvidence {
	session_id: string;
	bias_correction_ms2?: number | null;
	analytics_valid?: boolean | null;
}

export interface ProgressTrendEvidencePoint {
	sessionId: string;
	sessionDate: string;
	sessionNumber: number;
	techniqueOverall: number | null;
	smoothness: number | null;
	powerAverageW: number | null;
	powerPeakW: number | null;
	dataQualityBias: number | null;
	dataQualityValid: boolean | null;
}

/**
 * Build the longitudinal evidence used by Progress charts from the real
 * Performance Engine/session evidence. This deliberately does not invent
 * substitutes when a metric is unavailable: repeatability is not technique
 * or smoothness, and G × mass is force rather than power.
 */
export function buildProgressTrendEvidence(
	analyses: ProgressSessionAnalysis[],
	runs: ProgressRunEvidence[]
): ProgressTrendEvidencePoint[] {
	return analyses.map((session, index) => {
		const sessionRuns = runs.filter((run) => run.session_id === session.sessionId);
		const validBias = sessionRuns
			.map((run) => run.bias_correction_ms2)
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

		const analyticsValidity = sessionRuns
			.map((run) => run.analytics_valid)
			.filter((value): value is boolean => typeof value === 'boolean');

		const power = session.analysis?.selectedRun?.physics?.power;

		return {
			sessionId: session.sessionId,
			sessionDate: new Date(session.timestamp).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short'
			}),
			sessionNumber: index + 1,
			techniqueOverall: finiteOrNull(session.techniqueScores?.overall),
			smoothness: finiteOrNull(session.techniqueScores?.smoothness),
			powerAverageW: finiteOrNull(power?.averageW),
			powerPeakW: finiteOrNull(power?.peakW),
			dataQualityBias:
				validBias.length > 0 ? validBias.reduce((sum, value) => sum + value, 0) / validBias.length : null,
			dataQualityValid:
				analyticsValidity.length > 0 ? analyticsValidity.every((value) => value) : null
		};
	});
}

function finiteOrNull(value: number | null | undefined): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

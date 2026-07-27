import { analyseSession } from './analyseSession';
import { scoreRunTechnique, type TechniqueScoreBreakdown } from './techniqueScoring';
import { buildPerformanceInsightPack, type PerformanceInsightPack } from './insightBuilder';
import type { DetailLevel, RiderContext, SessionAnalysis, SessionLike } from './types';

export interface ComputeSessionInsightsInput {
	session: SessionLike;
	riderContext?: RiderContext;
	selectedRunIndex?: number;
	riderLevel?: string | null;
}

export interface SessionInsights {
	performanceAnalysis: SessionAnalysis;
	techniqueScoreBreakdown: TechniqueScoreBreakdown | null;
	insightPack: PerformanceInsightPack;
}

/**
 * The analyseSession -> scoreRunTechnique -> buildPerformanceInsightPack chain,
 * extracted so the server-loaded page and the client-side live setup preview
 * run the exact same analysis logic and can never quietly drift apart.
 */
export function computeSessionInsights(input: ComputeSessionInsightsInput): SessionInsights {
	const performanceAnalysis = analyseSession(input.session, input.riderContext ?? {}, {
		selectedRunIndex: input.selectedRunIndex ?? 0
	});

	const detailLevel = ((input.riderLevel as DetailLevel) || 'rider') as DetailLevel;

	const techniqueScoreBreakdown = performanceAnalysis.selectedRun
		? scoreRunTechnique(performanceAnalysis.selectedRun, performanceAnalysis, {
				riderLevel: detailLevel
			})
		: null;

	const insightPack = buildPerformanceInsightPack(performanceAnalysis, detailLevel);

	return { performanceAnalysis, techniqueScoreBreakdown, insightPack };
}

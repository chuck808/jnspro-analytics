import type { DetailLevel, SessionAnalysis } from './types';
import { buildCoachDiagnostics, type CoachDiagnostic } from './coachDiagnostics';
import { scoreRunTechnique, type TechniqueScoreBreakdown } from './techniqueScoring';

export interface PerformanceInsightPack {
	scores: TechniqueScoreBreakdown;
	diagnostics: CoachDiagnostic[];
	headline: string;
	plainEnglishSummary: string;
	strengths: string[];
	limiters: string[];
	nextActions: string[];
}

export function buildPerformanceInsightPack(
	analysis: SessionAnalysis,
	level: DetailLevel = 'rider'
): PerformanceInsightPack {
	const scores = scoreRunTechnique(analysis.selectedRun, analysis, { riderLevel: level });
	const diagnostics = buildCoachDiagnostics(analysis, scores);
	const strengths = buildStrengths(scores);
	const limiters = buildLimiters(scores);
	const headline = buildHeadline(scores, level);
	const plainEnglishSummary = buildSummary(scores, level, diagnostics);
	const nextActions = diagnostics
		.flatMap((d) => d.prescription)
		.slice(0, level === 'grom' ? 2 : level === 'rider' ? 3 : 6);

	return {
		scores,
		diagnostics,
		headline,
		plainEnglishSummary,
		strengths,
		limiters,
		nextActions
	};
}

function buildHeadline(scores: TechniqueScoreBreakdown, level: DetailLevel): string {
	if (level === 'grom') {
		if ((scores.overall ?? 0) >= 80) return 'Great start — keep it sharp';
		if ((scores.repeatability ?? 100) < 65)
			return 'Good effort — practise making starts repeatable';
		return 'Good data — one clear thing to practise';
	}

	if ((scores.explosiveness ?? 0) >= 75 && (scores.speedCarry ?? 100) < 60)
		return 'Explosive launch, speed carry needs work';
	if ((scores.launchQuality ?? 0) >= 80 && (scores.explosiveness ?? 0) < 60)
		return 'Fast reaction, drive force needs work';
	if ((scores.smoothness ?? 100) < 60) return 'Acceleration profile needs smoothing';
	if ((scores.overall ?? 0) >= 82) return 'Strong technical run profile';
	return 'Useful run profile with clear development targets';
}

function buildSummary(
	scores: TechniqueScoreBreakdown,
	level: DetailLevel,
	diagnostics: CoachDiagnostic[]
): string {
	if (level === 'grom') {
		if (diagnostics[0]?.tone === 'positive')
			return 'Nice work. The start is looking strong, so keep practising clean repeats.';
		return 'The start has useful positives. Focus on one small improvement rather than chasing everything at once.';
	}

	if (level === 'coach') {
		return diagnostics
			.map((d) => d.summary)
			.slice(0, 2)
			.join(' ');
	}

	const bits = [];
	if (scores.launchQuality !== null) bits.push(`launch ${scores.labels.launchQuality}`);
	if (scores.explosiveness !== null) bits.push(`explosiveness ${scores.labels.explosiveness}`);
	if (scores.speedCarry !== null) bits.push(`speed carry ${scores.labels.speedCarry}`);
	return bits.length
		? `Profile summary: ${bits.join(', ')}.`
		: 'Technique profile is available, but some source metrics are missing.';
}

function buildStrengths(scores: TechniqueScoreBreakdown): string[] {
	const out: string[] = [];
	if ((scores.launchQuality ?? 0) >= 75) out.push('Launch reaction');
	if ((scores.explosiveness ?? 0) >= 75) out.push('Early drive force');
	if ((scores.impulseTiming ?? 0) >= 75) out.push('Early impulse production');
	if ((scores.speedCarry ?? 0) >= 75) out.push('Speed carry');
	if ((scores.smoothness ?? 0) >= 75) out.push('Smooth force delivery');
	if ((scores.repeatability ?? 0) >= 75) out.push('Repeatability');
	return out;
}

function buildLimiters(scores: TechniqueScoreBreakdown): string[] {
	const out: string[] = [];
	if ((scores.launchQuality ?? 100) < 60) out.push('Gate reaction');
	if ((scores.explosiveness ?? 100) < 60) out.push('First-drive force');
	if ((scores.impulseTiming ?? 100) < 60) out.push('Impulse timing');
	if ((scores.speedCarry ?? 100) < 60) out.push('Speed carry');
	if ((scores.smoothness ?? 100) < 60) out.push('Smoothness');
	if ((scores.repeatability ?? 100) < 65) out.push('Repeatability');
	return out;
}

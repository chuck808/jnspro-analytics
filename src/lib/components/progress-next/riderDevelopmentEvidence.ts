import type { TechniqueScoreBreakdown } from '$lib/performance-engine/techniqueScoring';
import type { ProgressDimensionKey } from './progressDimensionPalette';

export type RiderDevelopmentEvidenceState = 'absent' | 'measured' | 'observed-history';

export interface RiderDevelopmentSessionPoint {
	sessionId: string;
	timestamp: string;
	insightPack: {
		scores: TechniqueScoreBreakdown;
	};
}

export interface RiderDevelopmentDimensionEvidence {
	key: ProgressDimensionKey;
	label: string;
	current: number;
	currentLabel: TechniqueScoreBreakdown['labels'][ProgressDimensionKey];
	history: Array<{
		sessionId: string;
		timestamp: string;
		value: number;
	}>;
}

export interface RiderDevelopmentEvidenceModel {
	state: RiderDevelopmentEvidenceState;
	supportedSessionCount: number;
	dimensions: RiderDevelopmentDimensionEvidence[];
	presentation: {
		label: 'No supported scores' | 'Measured' | 'Observed history';
		statement: string;
	};
}

const dimensions: Array<{ key: ProgressDimensionKey; label: string }> = [
	{ key: 'launchQuality', label: 'Launch Quality' },
	{ key: 'explosiveness', label: 'Explosiveness' },
	{ key: 'speedCarry', label: 'Speed Carry' },
	{ key: 'smoothness', label: 'Smoothness' },
	{ key: 'impulseTiming', label: 'Impulse Timing' },
	{ key: 'repeatability', label: 'Repeatability' }
];

function isScore(value: number | null | undefined): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Rider Development evidence boundary for /progress-next.
 *
 * The Performance Engine owns score construction and score labels. This model
 * only admits finite score observations from already-supported session analyses.
 * It deliberately does not turn first-to-latest score differences into trend
 * claims and does not rank dimensions into strengths, weaknesses, or coaching
 * opportunities.
 */
export function buildRiderDevelopmentEvidence(
	sessionAnalyses: RiderDevelopmentSessionPoint[]
): RiderDevelopmentEvidenceModel {
	const supportedSessions = sessionAnalyses.filter((session) =>
		dimensions.some(({ key }) => isScore(session.insightPack.scores[key]))
	);

	const evidenceDimensions = dimensions
		.map(({ key, label }) => {
			const history = supportedSessions
				.map((session) => {
					const value = session.insightPack.scores[key];
					return isScore(value)
						? { sessionId: session.sessionId, timestamp: session.timestamp, value }
						: null;
				})
				.filter((point): point is NonNullable<typeof point> => point !== null);
			const latest = history.at(-1);
			if (!latest) return null;
			const latestSource = supportedSessions.find((session) => session.sessionId === latest.sessionId);
			if (!latestSource) return null;
			return {
				key,
				label,
				current: latest.value,
				currentLabel: latestSource.insightPack.scores.labels[key],
				history
			};
		})
		.filter((dimension): dimension is NonNullable<typeof dimension> => dimension !== null);

	const state: RiderDevelopmentEvidenceState =
		supportedSessions.length === 0
			? 'absent'
			: supportedSessions.length === 1
				? 'measured'
				: 'observed-history';

	return {
		state,
		supportedSessionCount: supportedSessions.length,
		dimensions: evidenceDimensions,
		presentation:
			state === 'absent'
				? {
						label: 'No supported scores',
						statement: 'Rider Development will appear when a supported session produces a measured Performance Engine score.'
					}
				: state === 'measured'
					? {
							label: 'Measured',
							statement: '1 analysed session provides measured rider-development scores. More supported observations are needed before history can be shown.'
						}
					: {
							label: 'Observed history',
							statement: `${supportedSessions.length} analysed sessions provide score history. No cross-session trend or coaching claim is inferred here.`
						}
	};
}

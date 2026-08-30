export interface StrengthsLimitersSessionAnalysisLike {
	sessionId: string;
	timestamp: string;
	insightPack?: {
		strengths?: string[];
		limiters?: string[];
	};
}

export interface RepeatedThemeEvidence {
	name: string;
	occurrenceCount: number;
	supportedAnalysisCount: number;
	latestTimestamp: string;
	latestSessionId: string;
}

export interface StrengthsLimitersEvidenceModel {
	state: 'absent' | 'observed' | 'repeated';
	supportedAnalysisCount: number;
	strengths: RepeatedThemeEvidence[];
	limiters: RepeatedThemeEvidence[];
	presentation: {
		label: 'No supported analyses' | 'Themes observed' | 'Repeated themes';
		statement: string;
	};
}

function buildRepeatedThemes(
	key: 'strengths' | 'limiters',
	sessions: StrengthsLimitersSessionAnalysisLike[]
): RepeatedThemeEvidence[] {
	const themes = new Map<
		string,
		{
			count: number;
			latestTimestamp: string;
			latestSessionId: string;
		}
	>();

	for (const session of sessions) {
		const sessionThemes = new Set(
			(session.insightPack?.[key] ?? []).map((item) => item.trim()).filter(Boolean)
		);
		for (const name of sessionThemes) {
			const existing = themes.get(name);
			if (!existing) {
				themes.set(name, {
					count: 1,
					latestTimestamp: session.timestamp,
					latestSessionId: session.sessionId
				});
				continue;
			}

			existing.count += 1;
			if (Date.parse(session.timestamp) >= Date.parse(existing.latestTimestamp)) {
				existing.latestTimestamp = session.timestamp;
				existing.latestSessionId = session.sessionId;
			}
		}
	}

	return [...themes.entries()]
		.filter(([, value]) => value.count >= 2)
		.map(([name, value]) => ({
			name,
			occurrenceCount: value.count,
			supportedAnalysisCount: sessions.length,
			latestTimestamp: value.latestTimestamp,
			latestSessionId: value.latestSessionId
		}))
		.sort((a, b) => {
			if (b.occurrenceCount !== a.occurrenceCount) return b.occurrenceCount - a.occurrenceCount;
			const latestDifference = Date.parse(b.latestTimestamp) - Date.parse(a.latestTimestamp);
			if (latestDifference !== 0) return latestDifference;
			return a.name.localeCompare(b.name);
		})
		.slice(0, 4);
}

export function buildStrengthsLimitersEvidence(
	sessionAnalyses: StrengthsLimitersSessionAnalysisLike[]
): StrengthsLimitersEvidenceModel {
	if (sessionAnalyses.length === 0) {
		return {
			state: 'absent',
			supportedAnalysisCount: 0,
			strengths: [],
			limiters: [],
			presentation: {
				label: 'No supported analyses',
				statement: 'Strength and limiter themes need supported session analysis before they can be observed.'
			}
		};
	}

	const strengths = buildRepeatedThemes('strengths', sessionAnalyses);
	const limiters = buildRepeatedThemes('limiters', sessionAnalyses);
	if (strengths.length === 0 && limiters.length === 0) {
		return {
			state: 'observed',
			supportedAnalysisCount: sessionAnalyses.length,
			strengths,
			limiters,
			presentation: {
				label: 'Themes observed',
				statement: 'Session-local strength and limiter labels exist, but none has repeated across supported analyses yet.'
			}
		};
	}

	return {
		state: 'repeated',
		supportedAnalysisCount: sessionAnalyses.length,
		strengths,
		limiters,
		presentation: {
			label: 'Repeated themes',
			statement: 'These exact engine-generated labels recur across supported session analyses. No improvement or decline is inferred from recurrence alone.'
		}
	};
}

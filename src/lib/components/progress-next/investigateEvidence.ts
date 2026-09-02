import type { CoachDiagnostic } from '$lib/performance-engine/coachDiagnostics';

export type InvestigateTone = CoachDiagnostic['tone'];

export interface InvestigateSessionAnalysisLike {
	sessionId: string;
	timestamp: string;
	diagnostics?: Array<
		Pick<CoachDiagnostic, 'title' | 'tone' | 'summary' | 'evidence' | 'prescription' | 'audience'>
	>;
}

export interface RepeatedDiagnosticEvidence {
	title: string;
	occurrenceCount: number;
	supportedAnalysisCount: number;
	latestTimestamp: string;
	latestSessionId: string;
	latestTone: InvestigateTone;
	latestSummary: string;
	latestEvidence: string[];
	latestPrescription: string[];
	latestAudience: CoachDiagnostic['audience'];
}

export interface InvestigateEvidenceModel {
	state: 'absent' | 'observed' | 'repeated';
	supportedAnalysisCount: number;
	signals: RepeatedDiagnosticEvidence[];
	presentation: {
		label: 'No supported analyses' | 'Signals observed' | 'Repeated signals';
		statement: string;
	};
}

export function buildInvestigateEvidence(
	sessionAnalyses: InvestigateSessionAnalysisLike[]
): InvestigateEvidenceModel {
	if (sessionAnalyses.length === 0) {
		return {
			state: 'absent',
			supportedAnalysisCount: 0,
			signals: [],
			presentation: {
				label: 'No supported analyses',
				statement: 'Diagnostic recurrence needs supported session analysis before it can be observed.'
			}
		};
	}

	type LatestDiagnostic = Pick<
		CoachDiagnostic,
		'tone' | 'summary' | 'evidence' | 'prescription' | 'audience'
	>;

	const signals = new Map<
		string,
		{
			count: number;
			latestTimestamp: string;
			latestSessionId: string;
			latest: LatestDiagnostic;
		}
	>();

	for (const session of sessionAnalyses) {
		const byTitle = new Map<string, LatestDiagnostic>();
		for (const diagnostic of session.diagnostics ?? []) {
			const title = diagnostic.title.trim();
			if (title) {
				byTitle.set(title, {
					tone: diagnostic.tone,
					summary: diagnostic.summary,
					evidence: diagnostic.evidence,
					prescription: diagnostic.prescription,
					audience: diagnostic.audience
				});
			}
		}

		for (const [title, latest] of byTitle) {
			const existing = signals.get(title);
			if (!existing) {
				signals.set(title, {
					count: 1,
					latestTimestamp: session.timestamp,
					latestSessionId: session.sessionId,
					latest
				});
				continue;
			}

			existing.count += 1;
			if (Date.parse(session.timestamp) >= Date.parse(existing.latestTimestamp)) {
				existing.latestTimestamp = session.timestamp;
				existing.latestSessionId = session.sessionId;
				existing.latest = latest;
			}
		}
	}

	const repeated = [...signals.entries()]
		.filter(([, value]) => value.count >= 2)
		.map(([title, value]) => ({
			title,
			occurrenceCount: value.count,
			supportedAnalysisCount: sessionAnalyses.length,
			latestTimestamp: value.latestTimestamp,
			latestSessionId: value.latestSessionId,
			latestTone: value.latest.tone,
			latestSummary: value.latest.summary,
			latestEvidence: value.latest.evidence,
			latestPrescription: value.latest.prescription,
			latestAudience: value.latest.audience
		}))
		.sort((a, b) => {
			if (b.occurrenceCount !== a.occurrenceCount) return b.occurrenceCount - a.occurrenceCount;
			const latestDifference = Date.parse(b.latestTimestamp) - Date.parse(a.latestTimestamp);
			if (latestDifference !== 0) return latestDifference;
			return a.title.localeCompare(b.title);
		})
		.slice(0, 5);

	if (repeated.length === 0) {
		return {
			state: 'observed',
			supportedAnalysisCount: sessionAnalyses.length,
			signals: [],
			presentation: {
				label: 'Signals observed',
				statement: 'Session diagnostics exist, but no exact diagnostic title has repeated across supported analyses yet.'
			}
		};
	}

	return {
		state: 'repeated',
		supportedAnalysisCount: sessionAnalyses.length,
		signals: repeated,
		presentation: {
			label: 'Repeated signals',
			statement: 'These exact session-level diagnostic titles recur across supported analyses. Recurrence is not a diagnosis or a Progress trend claim.'
		}
	};
}

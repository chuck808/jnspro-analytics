import type { PageServerLoad } from './$types';
import { shouldExcludeFromStats } from '$lib/types/runs';
import {
	prepareCorrelationData,
	generateCorrelationInsights
} from '$lib/analytics/correlationAnalysis';
import {
	analyseSession,
	scoreRunTechnique,
	buildCoachDiagnostics,
	buildPerformanceInsightPack
} from '$lib/performance-engine';
import type {
	SessionAnalysis,
	TechniqueAnalysis,
	CoachDiagnostic,
	PerformanceInsightPack
} from '$lib/performance-engine';
import { buildSessionSummaries } from '$lib/server/sessionSummaryBuilder';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();
	if (!profile)
		return {
			sessions: [],
			sessionCount: 0,
			depth: 'none' as const,
			allRuns: [],
			personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null },
			trend: { reaction: null, speed: null },
			activeGoalMetrics: [],
			goalTargets: {},
			bikes: [],
			coachLinks: [],
			riderWeightKg: null
		};

	const { data: bikes } = await supabase
		.from('bikes')
		.select('id, name, weight_kg')
		.eq('user_id', profile.id);
	const bikeById = new Map((bikes ?? []).map((bike) => [bike.id, bike]));

	// Biometrics are versioned separately from the identity profile. Keep all
	// rider snapshots so historical physics uses the snapshot linked to the
	// session rather than today's weight/rider level.
	const { data: riderProfiles } = await supabase
		.from('rider_profiles')
		.select('id, weight_kg, rider_level, effective_from')
		.eq('user_id', profile.id)
		.order('effective_from', { ascending: true });
	const riderProfileById = new Map((riderProfiles ?? []).map((row) => [row.id, row]));
	const latestRiderProfile = riderProfiles?.[riderProfiles.length - 1] ?? null;

	const { data: sessions, error } = await supabase
		.from('sessions')
		.select(
			'id, timestamp, session_type, weather_conditions, track_surface, session_focus, ride_feel, bike_id, rider_profile_id'
		)
		.eq('user_id', profile.id)
		.eq('archived', false)
		.eq('session_type', 'gate')
		.order('timestamp', { ascending: true });

	if (error || !sessions) {
		return {
			sessions: [],
			sessionCount: 0,
			depth: 'none' as const,
			allRuns: [],
			personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null },
			trend: { reaction: null, speed: null },
			activeGoalMetrics: [],
			goalTargets: {},
			coachLinks: [],
			riderWeightKg: latestRiderProfile?.weight_kg ?? null
		};
	}

	// ── ACTIVE COACH LINKS (for the "Send to Coach" report action) ────────────
	const { data: coachLinkRows } = await supabase
		.from('coach_rider_links')
		.select('id, coach_id')
		.eq('rider_id', profile.id)
		.eq('status', 'active');

	const coachIds = (coachLinkRows ?? []).map((l) => l.coach_id);
	const { data: coachProfiles } =
		coachIds.length > 0
			? await supabase.from('profiles').select('id, name').in('id', coachIds)
			: { data: [] };
	const coachNameById = new Map((coachProfiles ?? []).map((c) => [c.id, c.name]));

	const coachLinks = (coachLinkRows ?? []).map((l) => ({
		linkId: l.id,
		coachName: coachNameById.get(l.coach_id) ?? 'Coach'
	}));

	const sessionIds = sessions.map((s) => s.id);
	const { data: runs, error: runsError } = await supabase
		.from('runs')
		.select('id, session_id, run_number, elapsed_time_ms, distance_m, chart_data, tags')
		.in('session_id', sessionIds);

	if (runsError) {
		return {
			sessions: [],
			sessionCount: 0,
			depth: 'none' as const,
			allRuns: [],
			personalBests: { reaction_ms: null, peak_speed_ms: null, max_g: null },
			trend: { reaction: null, speed: null },
			activeGoalMetrics: [],
			goalTargets: {},
			coachLinks,
			riderWeightKg: latestRiderProfile?.weight_kg ?? null
		};
	}

	const runIds = (runs || []).map((r) => r.id);
	const { data: gateRuns } = await supabase
		.from('gate_runs')
		.select(
			'run_id, reaction_time_ms, max_g, avg_g, peak_speed_ms, avg_speed_ms_calc, time_to_peak_speed_ms, analytics_valid, max_pitch_deg, front_wheel_lifted, bias_correction_ms2'
		)
		.in('run_id', runIds);

	const sessionsWithRuns = sessions.map((session) => ({
		...session,
		runs: (runs || [])
			.filter((r) => r.session_id === session.id)
			.map((run) => ({
				...run,
				gate_runs: (gateRuns || []).filter((gr) => gr.run_id === run.id)
			}))
	}));

	const allRuns = sessionsWithRuns.flatMap((session) =>
		(session.runs ?? [])
			.filter((run) => !shouldExcludeFromStats(run.tags as any))
			.flatMap((run) =>
				(run.gate_runs ?? []).map((g) => ({
					session_id: session.id,
					session_date: session.timestamp,
					reaction_time_ms: g.reaction_time_ms,
					max_g: g.max_g,
					peak_speed_ms: g.analytics_valid ? (g.peak_speed_ms ?? null) : null,
					analytics_valid: g.analytics_valid,
					bias_correction_ms2: g.bias_correction_ms2,
					front_wheel_lifted: g.front_wheel_lifted
				}))
			)
	);

	const sessionSummaries = buildSessionSummaries(sessionsWithRuns as any);
	const sessionCount = sessionSummaries.length;

	let depth: 'none' | 'minimal' | 'basic' | 'full' | 'advanced';
	if (sessionCount === 0) depth = 'none';
	else if (sessionCount <= 2) depth = 'minimal';
	else if (sessionCount <= 9) depth = 'basic';
	else if (sessionCount <= 19) depth = 'full';
	else depth = 'advanced';

	const allReactions = sessionSummaries
		.map((s) => s.best_reaction_ms)
		.filter((v): v is number => v !== null);
	const allSpeeds = sessionSummaries
		.map((s) => s.best_peak_speed_ms)
		.filter((v): v is number => v !== null && v > 0);
	const allMaxG = sessionSummaries.map((s) => s.best_max_g).filter((v): v is number => v !== null);

	const personalBests = {
		reaction_ms: allReactions.length > 0 ? Math.min(...allReactions) : null,
		peak_speed_ms: allSpeeds.length > 0 ? Math.max(...allSpeeds) : null,
		max_g: allMaxG.length > 0 ? Math.max(...allMaxG) : null
	};

	const trend: { reaction: number | null; speed: number | null } = { reaction: null, speed: null };
	if (sessionCount >= 6) {
		const recent = sessionSummaries.slice(-5);
		const previous = sessionSummaries.slice(-10, -5);
		const avgRecent =
			recent.reduce((s: number, sess: any) => s + sess.avg_reaction_ms, 0) / recent.length;
		const avgPrevious =
			previous.reduce((s: number, sess: any) => s + sess.avg_reaction_ms, 0) / previous.length;
		trend.reaction = avgPrevious > 0 ? ((avgRecent - avgPrevious) / avgPrevious) * 100 : null;

		const recentSpeeds = recent
			.filter((s: any) => s.avg_peak_speed_ms)
			.map((s: any) => s.avg_peak_speed_ms!);
		const previousSpeeds = previous
			.filter((s: any) => s.avg_peak_speed_ms)
			.map((s: any) => s.avg_peak_speed_ms!);
		if (recentSpeeds.length > 0 && previousSpeeds.length > 0) {
			const avgRS = recentSpeeds.reduce((s: number, v: number) => s + v, 0) / recentSpeeds.length;
			const avgPS =
				previousSpeeds.reduce((s: number, v: number) => s + v, 0) / previousSpeeds.length;
			trend.speed = ((avgRS - avgPS) / avgPS) * 100;
		}
	}

	const { data: goals } = await supabase
		.from('training_goals')
		.select('metric, target_value, start_value, current_value, deadline')
		.eq('user_id', profile.id)
		.is('completed_at', null);

	const activeGoalMetrics = new Set((goals ?? []).map((g) => g.metric));
	const goalTargets = (goals ?? []).reduce(
		(acc, goal) => {
			acc[goal.metric] = {
				target: goal.target_value,
				start: goal.start_value,
				current: goal.current_value,
				deadline: goal.deadline
			};
			return acc;
		},
		{} as Record<string, any>
	);

	const correlationData = prepareCorrelationData(sessionsWithRuns, sessionSummaries);
	const correlationInsights = generateCorrelationInsights(correlationData, 10);

	interface SessionAnalysisResult {
		sessionId: string;
		timestamp: string;
		analysis: SessionAnalysis;
		techniqueScores: TechniqueAnalysis | null;
		diagnostics: CoachDiagnostic[];
		insightPack: PerformanceInsightPack;
	}

	let sessionAnalyses: SessionAnalysisResult[] = [];

	if (sessionCount > 0) {
		const analysisLimit = depth === 'advanced' ? 30 : sessionCount;
		const sessionsToAnalyze = sessionsWithRuns.slice(-analysisLimit);

		sessionAnalyses = sessionsToAnalyze
			.map((session) => {
				const sessionRuns = session.runs || [];
				const eligibleRuns = sessionRuns.filter((r: any) => !shouldExcludeFromStats(r.tags as any));
				if (eligibleRuns.length === 0 || !eligibleRuns.some((r: any) => r.chart_data)) return null;

				try {
					const sessionForAnalysis = {
						id: session.id,
						session_type: session.session_type,
						timestamp: session.timestamp,
						runs: eligibleRuns.map((run: any) => ({
							id: run.id,
							run_number: run.run_number,
							elapsed_time_ms: run.elapsed_time_ms,
							chart_data: run.chart_data,
							gate_runs: run.gate_runs?.[0] || null
						}))
					};

					const sessionRiderProfile =
						(session.rider_profile_id ? riderProfileById.get(session.rider_profile_id) : null) ??
						latestRiderProfile;
					const sessionBike = session.bike_id ? bikeById.get(session.bike_id) : null;
					const riderLevel = sessionRiderProfile?.rider_level ?? 'rider';

					const analysis = analyseSession(sessionForAnalysis as any, {
						riderWeightKg: sessionRiderProfile?.weight_kg ?? undefined,
						bikeWeightKg: sessionBike?.weight_kg ?? undefined,
						riderLevel: riderLevel as any,
						sessionFocus: (session as any).session_focus ?? null,
						rideFeel: (session as any).ride_feel ?? null,
						weatherCondition: (session as any).weather_conditions ?? null,
						trackSurface: (session as any).track_surface ?? null
					});

					const techniqueScores = analysis.selectedRun?.technique ?? null;
					let diagnostics: CoachDiagnostic[] = [];
					if (analysis.selectedRun) {
						const scoreBreakdown = scoreRunTechnique(analysis.selectedRun, analysis, {
							riderLevel: riderLevel as any
						});
						diagnostics = buildCoachDiagnostics(analysis, scoreBreakdown, {
							sessionFocus: (session as any).session_focus ?? null,
							rideFeel: (session as any).ride_feel ?? null
						});
					}

					const insightPack = buildPerformanceInsightPack(analysis, riderLevel as any);

					return {
						sessionId: session.id,
						timestamp: session.timestamp,
						analysis,
						techniqueScores,
						diagnostics,
						insightPack
					};
				} catch (error) {
					console.error(`Error analyzing session ${session.id}:`, error);
					return null;
				}
			})
			.filter((result): result is SessionAnalysisResult => result !== null);
	}

	return {
		profile,
		sessions: sessionSummaries,
		sessionCount,
		depth,
		allRuns,
		personalBests,
		trend,
		activeGoalMetrics: Array.from(activeGoalMetrics),
		goalTargets,
		bikes: bikes ?? [],
		coachLinks,
		correlationInsights,
		sessionAnalyses,
		riderWeightKg: latestRiderProfile?.weight_kg ?? null
	};
};
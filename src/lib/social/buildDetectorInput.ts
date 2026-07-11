/**
 * Social Layer — Detector Input Builder
 *
 * Assembles AchievementDetectorInput from data already available on the
 * session page. No additional DB queries required.
 *
 * Call this once on the session page after the performance analysis is ready,
 * then pass the result to detectAchievement().
 */

import type { AchievementDetectorInput, AchievementContext, PrivacyMode } from './types';

interface SessionPageData {
	session: {
		id: string;
		timestamp: string;
		weather_conditions?: string | null;
		track_surface?: string | null;
		session_focus?: string | null;
		ride_feel?: string | null;
	};
	sessionStats: {
		run_count: number;
		included_run_count: number;
		excluded_run_count: number;
		best_reaction_ms: number | null;
		avg_reaction_ms: number | null;
		reaction_cv: number | null;
		best_peak_speed_ms: number | null;
		best_max_g: number | null;
		has_valid_speed: boolean;
	};
	allTimePBs: {
		bestReactionMs: number | null;
		bestSpeedMs: number | null;
		bestMaxG: number | null;
	};
	goalProgress: Array<{
		goalId: string;
		metric: string;
		metricLabel: string;
		improvement: string;
		percentToGoal: number;
		isSignificant: boolean;
		newValue?: number | null;
	}> | null;
	profile: {
		id: string;
		name?: string | null;
		display_name?: string | null;
		show_on_leaderboard?: boolean | null;
		leaderboard_display_name?: string | null;
	} | null;
	// From advancedAnalytics cross-session report (may be null if < 3 sessions)
	crossSessionReport?: {
		sessionCount: number;
		overallTrend: string;
		performance?: {
			reactionTrend?: {
				direction: string;
				changePercent: number | null;
				improving: boolean;
			};
		};
		consistency?: {
			repeatabilityTrend?: {
				direction: string;
				improving: boolean;
			};
		};
		contextualPatterns?: {
			pbsByCondition: Record<
				string,
				{
					surface: string | null;
					bestReactionMs: number | null;
					sessionCount: number;
				}
			>;
			patterns: Array<{
				variable: string;
				metric: string;
				finding: string;
				bestCondition: string | null;
				confidence: string;
			}>;
		} | null;
	} | null;
	// From performance analysis (already computed on the session page)
	hasCalibrationWarning?: boolean;
	profileComplete?: boolean;
	dataQualityRating?: 'excellent' | 'good' | 'fair' | 'calibrate' | 'unknown' | null;
}

/**
 * Build the achievement detector input from session page data.
 * Designed to be called in a $derived block on the session page.
 */
export function buildDetectorInput(
	data: SessionPageData,
	privacyMode: PrivacyMode = 'private'
): AchievementDetectorInput {
	const session = data.session;

	// ── Context ──────────────────────────────────────────────────────────────
	const weatherCondition = (session as any).weather_conditions ?? null;
	const trackSurface = (session as any).track_surface ?? null;
	const sessionFocus = (session as any).session_focus ?? null;
	const rideFeel = (session as any).ride_feel ?? null;

	const isChallengingConditions =
		trackSurface === 'wet' ||
		trackSurface === 'muddy' ||
		trackSurface === 'damp' ||
		weatherCondition === 'rain' ||
		weatherCondition === 'light-rain' ||
		weatherCondition === 'windy' ||
		weatherCondition === 'cold';

	const context: AchievementContext = {
		weatherCondition,
		trackSurface,
		sessionFocus,
		rideFeel,
		isChallengingConditions,
		isLowReadiness: rideFeel === 'off',
		isHighReadiness: rideFeel === 'dialled' || rideFeel === 'peak'
	};

	// ── Display name ─────────────────────────────────────────────────────────
	const profile = data.profile;
	const riderDisplayName =
		profile?.leaderboard_display_name ?? profile?.name ?? profile?.display_name ?? 'Rider';

	// ── Cross-session longitudinal data ──────────────────────────────────────
	const csr = data.crossSessionReport;
	const longitudinal = csr
		? {
				sessionCount: csr.sessionCount,
				overallTrend: csr.overallTrend,
				reactionTrend: {
					direction: csr.performance?.reactionTrend?.direction ?? 'unknown',
					changePercent: csr.performance?.reactionTrend?.changePercent ?? null,
					improving: csr.performance?.reactionTrend?.improving ?? false
				},
				consistencyTrend: {
					direction: csr.consistency?.repeatabilityTrend?.direction ?? 'unknown',
					improving: csr.consistency?.repeatabilityTrend?.improving ?? false
				},
				contextualPatterns: csr.contextualPatterns ?? null
			}
		: null;

	return {
		sessionId: session.id,
		riderId: profile?.id ?? '',
		riderDisplayName,
		sessionDate: session.timestamp,
		sessionStats: data.sessionStats,
		allTimePBs: data.allTimePBs,
		goalProgress: data.goalProgress ?? null,
		context,
		dataQualityRating: data.dataQualityRating ?? null,
		analyticsValid: !(data.hasCalibrationWarning ?? false),
		hasCalibrationWarning: data.hasCalibrationWarning ?? false,
		longitudinal,
		privacyMode
	};
}

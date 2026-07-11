/**
 * Leaderboards
 *
 * Reads from public.leaderboard_view (opt-in riders only) via the admin
 * client in page.server.ts. The functions here are pure data-shaping helpers
 * that operate on the rows returned by the server — no DB calls in this file.
 *
 * DB writes (opt-in, opt-out, display name) go through the settings page
 * actions which update user_preferences; the upload API then syncs
 * show_on_leaderboard into rider_performance_snapshots via upsertSnapshot().
 */

import type { AgeGroup, ExperienceLevel } from './peerComparison';

export type TimePeriod = 'all_time' | 'month' | 'week';
export type LeaderboardMetric = 'reactionTime' | 'peakSpeed' | 'maxG' | 'consistency';

export interface LeaderboardEntry {
	rank: number;
	userId: string;
	displayName: string;
	value: number;
	isCurrentUser: boolean;
	ageGroup?: AgeGroup;
	experienceLevel?: ExperienceLevel;
	sessionCount?: number;
}

export interface LeaderboardOptions {
	metric: LeaderboardMetric;
	timePeriod: TimePeriod;
	ageGroup?: AgeGroup;
	experienceLevel?: ExperienceLevel;
	limit?: number;
}

export interface LeaderboardResult {
	entries: LeaderboardEntry[];
	userRank: number | null;
	userEntry: LeaderboardEntry | null;
	totalEntries: number;
	filters: {
		metric: LeaderboardMetric;
		timePeriod: TimePeriod;
		ageGroup?: AgeGroup;
		experienceLevel?: ExperienceLevel;
	};
}

// Raw row shape from public.leaderboard_view
export interface LeaderboardViewRow {
	user_id: string;
	display_name: string;
	age_group: string | null;
	experience_level: string | null;
	session_count: number;
	best_reaction_ms: number | null;
	best_peak_speed_ms: number | null;
	best_max_g: number | null;
	best_consistency: number | null;
}

/**
 * Column selector for each metric.
 * Lower reaction time is better — entries are sorted ASC for that metric,
 * DESC for all others, in the query built in page.server.ts.
 */
export const METRIC_COLUMN: Record<LeaderboardMetric, keyof LeaderboardViewRow> = {
	reactionTime: 'best_reaction_ms',
	peakSpeed: 'best_peak_speed_ms',
	maxG: 'best_max_g',
	consistency: 'best_consistency'
};

export const METRIC_LOWER_IS_BETTER: Record<LeaderboardMetric, boolean> = {
	reactionTime: true,
	peakSpeed: false,
	maxG: false,
	consistency: false
};

/**
 * Shape raw leaderboard_view rows into LeaderboardResult.
 * Called from page.server.ts after querying the DB.
 */
export function shapeLeaderboard(
	rows: LeaderboardViewRow[],
	options: LeaderboardOptions,
	currentUserId: string
): LeaderboardResult {
	const col = METRIC_COLUMN[options.metric];
	const lowerBetter = METRIC_LOWER_IS_BETTER[options.metric];
	const limit = options.limit ?? 100;

	// Filter to rows that have a value for this metric
	const withValue = rows.filter((r) => r[col] != null);

	// Sort
	withValue.sort((a, b) => {
		const av = a[col] as number;
		const bv = b[col] as number;
		return lowerBetter ? av - bv : bv - av;
	});

	const limited = withValue.slice(0, limit);

	const entries: LeaderboardEntry[] = limited.map((row, i) => ({
		rank: i + 1,
		userId: row.user_id,
		displayName: row.display_name,
		value: row[col] as number,
		isCurrentUser: row.user_id === currentUserId,
		ageGroup: row.age_group as AgeGroup | undefined,
		experienceLevel: row.experience_level as ExperienceLevel | undefined,
		sessionCount: row.session_count
	}));

	const userEntry = entries.find((e) => e.isCurrentUser) ?? null;

	return {
		entries,
		userRank: userEntry?.rank ?? null,
		userEntry,
		totalEntries: withValue.length,
		filters: {
			metric: options.metric,
			timePeriod: options.timePeriod,
			ageGroup: options.ageGroup,
			experienceLevel: options.experienceLevel
		}
	};
}

// ── Display helpers (unchanged, used in .svelte) ─────────────────────────────

export function getMetricDisplayName(metric: LeaderboardMetric): string {
	switch (metric) {
		case 'reactionTime':
			return 'Reaction Time';
		case 'peakSpeed':
			return 'Peak Speed';
		case 'maxG':
			return 'Maximum G-Force';
		case 'consistency':
			return 'Consistency Score';
	}
}

export function getTimePeriodDisplayName(period: TimePeriod): string {
	switch (period) {
		case 'all_time':
			return 'All Time';
		case 'month':
			return 'This Month';
		case 'week':
			return 'This Week';
	}
}

export function formatLeaderboardValue(value: number, metric: LeaderboardMetric): string {
	switch (metric) {
		case 'reactionTime':
			return `${(value / 1000).toFixed(3)}s`;
		case 'peakSpeed':
			return `${(value * 3.6).toFixed(1)} km/h`;
		case 'maxG':
			return `${value.toFixed(2)}g`;
		case 'consistency':
			return `${value.toFixed(1)}%`;
	}
}

export function getRankMedal(rank: number): string {
	switch (rank) {
		case 1:
			return '🥇';
		case 2:
			return '🥈';
		case 3:
			return '🥉';
		default:
			return '';
	}
}

export function isTopPercentage(rank: number, totalEntries: number, percentage: number): boolean {
	if (totalEntries === 0) return false;
	return rank <= Math.ceil(totalEntries * (percentage / 100));
}

export function generateAnonymousName(userId: string): string {
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		const char = userId.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	const abs = Math.abs(hash);
	const adjectives = ['Fast', 'Quick', 'Swift', 'Rapid', 'Lightning', 'Speed', 'Power', 'Pro'];
	const nouns = ['Rider', 'Racer', 'Pilot', 'Athlete', 'Champion', 'Star', 'Ace', 'Legend'];
	const adj = adjectives[abs % adjectives.length];
	const noun = nouns[Math.floor(abs / adjectives.length) % nouns.length];
	const num = (abs % 9999).toString().padStart(4, '0');
	return `${adj}${noun}${num}`;
}

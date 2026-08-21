import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import {
	compareToPeers,
	fetchBenchmarkForMetric,
	estimateExperienceLevel,
	METRIC_COLUMN,
	METRIC_LOWER_IS_BETTER,
	type AgeGroup,
	type ExperienceLevel,
	type LeaderboardMetric,
	type LeaderboardResult,
	type LeaderboardViewRow,
	type TimePeriod
} from '$lib/services/benchmarking';
import { calculateAge } from '$lib/utils/uciCategories';

// Competitive ranking is deliberately a secondary, opt-in surface. A filtered
// leaderboard needs enough riders in that actual cohort before rank language is shown.
const MIN_LEADERBOARD_COHORT = 10;
const LEADERBOARD_PAGE_SIZE = 100;

const METRICS: LeaderboardMetric[] = ['reactionTime', 'peakSpeed', 'maxG', 'consistency'];
const AGE_GROUPS: AgeGroup[] = ['13-17', '18-25', '26-35', '36-45', '46+'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced', 'elite'];

const BENCHMARK_METRIC: Record<
	LeaderboardMetric,
	'reaction_ms' | 'peak_speed_ms' | 'max_g' | 'consistency'
> = {
	reactionTime: 'reaction_ms',
	peakSpeed: 'peak_speed_ms',
	maxG: 'max_g',
	consistency: 'consistency'
};

function validMetric(value: string | null): LeaderboardMetric {
	return METRICS.includes(value as LeaderboardMetric) ? (value as LeaderboardMetric) : 'reactionTime';
}

function validAgeGroup(value: string | null): AgeGroup | undefined {
	return AGE_GROUPS.includes(value as AgeGroup) ? (value as AgeGroup) : undefined;
}

function validExperience(value: string | null): ExperienceLevel | undefined {
	return EXPERIENCE_LEVELS.includes(value as ExperienceLevel)
		? (value as ExperienceLevel)
		: undefined;
}

function ageGroupForAge(age: number | null): AgeGroup | 'unknown' {
	if (age === null || age < 13) return 'unknown';
	if (age < 18) return '13-17';
	if (age < 26) return '18-25';
	if (age < 36) return '26-35';
	if (age < 46) return '36-45';
	return '46+';
}

function snapshotValue(snapshot: any, metric: LeaderboardMetric): number | null {
	const column = METRIC_COLUMN[metric];
	const value = snapshot?.[column];
	return typeof value === 'number' ? value : null;
}

export const load: PageServerLoad = async ({ locals: { supabase }, parent, url }) => {
	const { profile } = await parent();
	const admin = createSupabaseAdminClient();

	const selectedMetric = validMetric(url.searchParams.get('metric'));
	// Snapshots are all-time bests. Week/month used to change the label without
	// changing the evidence, so those query values are intentionally ignored.
	const selectedPeriod: TimePeriod = 'all_time';

	const empty = {
		leaderboards: null as Record<string, LeaderboardResult> | null,
		peerBenchmark: null as any,
		selectedMetric,
		selectedPeriod,
		selectedAgeGroup: undefined as AgeGroup | undefined,
		selectedExperience: undefined as ExperienceLevel | undefined,
		competitiveCohortSize: 0,
		competitiveMinimum: MIN_LEADERBOARD_COHORT,
		userOptedIn: false,
		userDisplayName: null as string | null,
		profile
	};

	if (!profile) return empty;

	const [prefsResult, snapshotResult, riderProfileResult] = await Promise.all([
		supabase
			.from('user_preferences')
			.select('show_on_leaderboard, leaderboard_display_name')
			.eq('user_id', profile.id)
			.maybeSingle(),
		admin
			.from('rider_performance_snapshots')
			.select(
				'user_id, age_group, uci_category, experience_level, session_count, show_on_leaderboard, display_name, best_reaction_ms, best_peak_speed_ms, best_max_g, best_consistency'
			)
			.eq('user_id', profile.id)
			.maybeSingle(),
		admin
			.from('rider_profiles')
			.select('date_of_birth')
			.eq('user_id', profile.id)
			.order('effective_from', { ascending: false })
			.limit(1)
			.maybeSingle()
	]);

	const prefs = prefsResult.data;
	const snapshot = snapshotResult.data;
	const age = calculateAge(riderProfileResult.data?.date_of_birth);
	const riderAgeGroup = ageGroupForAge(age);
	const experienceLevel =
		(snapshot?.experience_level as ExperienceLevel | null) ??
		estimateExperienceLevel(snapshot?.session_count ?? 0, 50);

	// Default competitive filtering is age-relative when that taxonomy is valid.
	// Under-13 riders are not silently folded into 13-17; the current leaderboard
	// taxonomy cannot represent them honestly, so no default competitive ranking
	// is produced until a youth/UCI-category cohort is introduced.
	const requestedAge = validAgeGroup(url.searchParams.get('ageGroup'));
	const requestedExperience = validExperience(url.searchParams.get('experience'));
	const selectedAge = requestedAge ?? (riderAgeGroup === 'unknown' ? undefined : riderAgeGroup);
	const selectedExp = requestedExperience;

	const userOptedIn = prefs?.show_on_leaderboard ?? false;
	const userDisplayName = prefs?.leaderboard_display_name ?? snapshot?.display_name ?? null;

	// ── Population benchmark (primary comparison truth model) ─────────────────
	// This uses performance_aggregates and its >=30-rider fallback rules. It is
	// separate from the opt-in competitive leaderboard below.
	let peerBenchmark: any = null;
	const userValue = snapshotValue(snapshot, selectedMetric);

	if (userValue !== null && riderAgeGroup !== 'unknown') {
		const benchmark = await fetchBenchmarkForMetric(
			admin,
			BENCHMARK_METRIC[selectedMetric],
			riderAgeGroup,
			experienceLevel
		);

		if (benchmark) {
			const comparison = compareToPeers(
				userValue,
				BENCHMARK_METRIC[selectedMetric],
				riderAgeGroup,
				experienceLevel,
				benchmark,
				METRIC_LOWER_IS_BETTER[selectedMetric]
			);

			peerBenchmark = {
				comparison,
				benchmark: {
					sampleSize: benchmark.sampleSize,
					lastUpdated: benchmark.lastUpdated.toISOString(),
					cohort: benchmark.cohort,
					percentile_10: benchmark.percentile_10,
					percentile_25: benchmark.percentile_25,
					percentile_50: benchmark.percentile_50,
					percentile_75: benchmark.percentile_75,
					percentile_90: benchmark.percentile_90
				},
				requestedCohort: {
					ageGroup: riderAgeGroup,
					experienceLevel
				}
			};
		}
	}

	// ── Competitive opt-in leaderboard (secondary comparison) ────────────────
	let leaderboards: Record<string, LeaderboardResult> | null = null;
	let competitiveCohortSize = 0;

	// Do not default an under-13 rider into an all-age competition. An explicit
	// age filter may still be used by an adult/parent viewing another cohort.
	const canShowCompetitiveRanking = riderAgeGroup !== 'unknown' || requestedAge !== undefined;

	if (canShowCompetitiveRanking) {
		const col = METRIC_COLUMN[selectedMetric] as string;
		const lowerBetter = METRIC_LOWER_IS_BETTER[selectedMetric];

		let countQuery = admin
			.from('leaderboard_view')
			.select('user_id', { count: 'exact', head: true })
			.not(col, 'is', null);
		if (selectedAge) countQuery = (countQuery as any).eq('age_group', selectedAge);
		if (selectedExp) countQuery = (countQuery as any).eq('experience_level', selectedExp);

		const { count } = await countQuery;
		competitiveCohortSize = count ?? 0;

		if (competitiveCohortSize >= MIN_LEADERBOARD_COHORT) {
			let rowsQuery = admin
				.from('leaderboard_view')
				.select(
					'user_id, display_name, age_group, experience_level, session_count, best_reaction_ms, best_peak_speed_ms, best_max_g, best_consistency'
				)
				.not(col, 'is', null)
				.order(col, { ascending: lowerBetter })
				.limit(LEADERBOARD_PAGE_SIZE);
			if (selectedAge) rowsQuery = (rowsQuery as any).eq('age_group', selectedAge);
			if (selectedExp) rowsQuery = (rowsQuery as any).eq('experience_level', selectedExp);

			const { data: topRows } = await rowsQuery;
			const rows = (topRows ?? []) as LeaderboardViewRow[];
			const entries = rows.map((row, index) => ({
				rank: index + 1,
				userId: row.user_id,
				displayName: row.display_name,
				value: row[METRIC_COLUMN[selectedMetric]] as number,
				isCurrentUser: row.user_id === profile.id,
				ageGroup: row.age_group as AgeGroup | undefined,
				experienceLevel: row.experience_level as ExperienceLevel | undefined,
				sessionCount: row.session_count
			}));

			let userEntry = entries.find((entry) => entry.isCurrentUser) ?? null;
			let userRank = userEntry?.rank ?? null;

			// Rank remains correct beyond the displayed top 100: count every rider
			// in the selected cohort with a strictly better value than the user.
			if (userOptedIn && userValue !== null && userRank === null) {
				let userRowQuery = admin
					.from('leaderboard_view')
					.select(
						'user_id, display_name, age_group, experience_level, session_count, best_reaction_ms, best_peak_speed_ms, best_max_g, best_consistency'
					)
					.eq('user_id', profile.id)
					.not(col, 'is', null);
				if (selectedAge) userRowQuery = (userRowQuery as any).eq('age_group', selectedAge);
				if (selectedExp) userRowQuery = (userRowQuery as any).eq('experience_level', selectedExp);
				const { data: currentUserRow } = await userRowQuery.maybeSingle();

				if (currentUserRow) {
					const currentValue = (currentUserRow as any)[col] as number;
					let betterQuery = admin
						.from('leaderboard_view')
						.select('user_id', { count: 'exact', head: true })
						.not(col, 'is', null);
					if (selectedAge) betterQuery = (betterQuery as any).eq('age_group', selectedAge);
					if (selectedExp) betterQuery = (betterQuery as any).eq('experience_level', selectedExp);
					betterQuery = lowerBetter
						? (betterQuery as any).lt(col, currentValue)
						: (betterQuery as any).gt(col, currentValue);
					const { count: betterCount } = await betterQuery;
					userRank = (betterCount ?? 0) + 1;
					userEntry = {
						rank: userRank,
						userId: currentUserRow.user_id,
						displayName: currentUserRow.display_name,
						value: currentValue,
						isCurrentUser: true,
						ageGroup: currentUserRow.age_group as AgeGroup | undefined,
						experienceLevel: currentUserRow.experience_level as ExperienceLevel | undefined,
						sessionCount: currentUserRow.session_count
					};
				}
			}

			leaderboards = {
				[selectedMetric]: {
					entries,
					userRank,
					userEntry,
					totalEntries: competitiveCohortSize,
					filters: {
						metric: selectedMetric,
						timePeriod: selectedPeriod,
						ageGroup: selectedAge,
						experienceLevel: selectedExp
					}
				}
			};
		}
	}

	return {
		leaderboards,
		peerBenchmark,
		selectedMetric,
		selectedPeriod,
		selectedAgeGroup: selectedAge,
		selectedExperience: selectedExp,
		competitiveCohortSize,
		competitiveMinimum: MIN_LEADERBOARD_COHORT,
		userOptedIn,
		userDisplayName,
		profile
	};
};

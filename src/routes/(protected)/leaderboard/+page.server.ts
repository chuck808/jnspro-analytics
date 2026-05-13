import type { PageServerLoad } from './$types';
import { generateLeaderboard, type LeaderboardOptions } from '$lib/services/benchmarking/leaderboards';

export const load: PageServerLoad = async ({ url, locals: { supabase }, parent }) => {
    const { profile } = await parent();
    if (!profile) {
        return {
            leaderboards: null,
            userOptedIn: false,
            userDisplayName: null
        };
    }

    // Get user's leaderboard preferences
    // Note: These columns may not exist yet in user_preferences table
    // They will be added when the schema is updated
    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

    const userOptedIn = prefs?.show_on_leaderboard ?? false;
    const userDisplayName = prefs?.leaderboard_display_name ?? null;

    // Get filter params from URL
    const metric = (url.searchParams.get('metric') || 'reactionTime') as LeaderboardOptions['metric'];
    const timePeriod = (url.searchParams.get('period') || 'all_time') as LeaderboardOptions['timePeriod'];
    const ageGroup = url.searchParams.get('ageGroup') as LeaderboardOptions['ageGroup'] | undefined;
    const experienceLevel = url.searchParams.get('experience') as LeaderboardOptions['experienceLevel'] | undefined;

    // Generate leaderboards for all metrics
    const metrics: LeaderboardOptions['metric'][] = ['reactionTime', 'peakSpeed', 'maxG', 'consistency'];
    
    const leaderboards = metrics.reduce((acc, m) => {
        acc[m] = generateLeaderboard(
            {
                metric: m,
                timePeriod,
                ageGroup,
                experienceLevel,
                limit: 100
            },
            profile.id
        );
        return acc;
    }, {} as Record<string, ReturnType<typeof generateLeaderboard>>);

    return {
        leaderboards,
        selectedMetric: metric,
        selectedPeriod: timePeriod,
        selectedAgeGroup: ageGroup,
        selectedExperience: experienceLevel,
        userOptedIn,
        userDisplayName,
        profile
    };
};

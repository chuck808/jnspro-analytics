import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const admin = createSupabaseAdminClient();

	// Fetch all sessions with detailed metrics
	const { data: sessions } = await admin
		.from('sessions')
		.select('id, user_id, timestamp, archived, runs(id)')
		.order('timestamp', { ascending: false });

	// Fetch user profiles for segmentation
	const { data: profiles } = await admin.from('profiles').select('id, email, created_at');

	// Calculate metrics
	const totalSessions = (sessions || []).length;
	const activeSessions = (sessions || []).filter((s) => !s.archived).length;

	// User segmentation by age (based on account age as proxy)
	const now = new Date();
	const userSegments = {
		new: 0, // < 7 days
		active: 0, // 7-30 days
		established: 0, // 30-90 days
		veteran: 0 // > 90 days
	};

	(profiles || []).forEach((profile) => {
		const accountAge = Math.floor(
			(now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
		);
		if (accountAge < 7) userSegments.new++;
		else if (accountAge < 30) userSegments.active++;
		else if (accountAge < 90) userSegments.established++;
		else userSegments.veteran++;
	});

	// Session distribution by user
	const sessionsByUser = (sessions || []).reduce<Record<string, number>>((acc, s) => {
		acc[s.user_id] = (acc[s.user_id] || 0) + 1;
		return acc;
	}, {});

	const sessionCounts = Object.values(sessionsByUser);
	const avgSessionsPerUser =
		sessionCounts.length > 0 ? sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length : 0;

	// Placeholder percentiles — NOT calculated from actual session data.
	// See performanceDistributionSimulated below, which +page.svelte uses to
	// badge this panel so it isn't mistaken for real benchmarking data.
	const performanceDistribution = {
		p10: 180, // reaction time ms
		p25: 220,
		p50: 270,
		p75: 320,
		p90: 380
	};
	const performanceDistributionSimulated = true;

	// Data quality metrics
	const sessionsWithRuns = (sessions || []).filter((s) => {
		const runs = s.runs as any[];
		return runs && runs.length > 0;
	});
	const dataQualityScore = totalSessions > 0 ? (sessionsWithRuns.length / totalSessions) * 100 : 0;

	return {
		stats: {
			totalSessions,
			activeSessions,
			avgSessionsPerUser: Math.round(avgSessionsPerUser * 10) / 10,
			dataQualityScore: Math.round(dataQualityScore)
		},
		userSegments,
		performanceDistribution,
		performanceDistributionSimulated,
		sessionsByUser: Object.entries(sessionsByUser)
			.map(([user_id, count]) => ({
				user_id,
				count
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10)
	};
};

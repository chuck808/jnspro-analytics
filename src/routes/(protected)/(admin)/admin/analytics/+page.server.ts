import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	// Use admin client to access analytics data
	const admin = createSupabaseAdminClient();

	// Get analytics data
	const now = new Date();
	const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	// Page views by route (mock data for now - you'd track this in a real analytics system)
	const pageViews = [
		{ route: '/dashboard', views: 1247, avgTime: '2m 34s' },
		{ route: '/sessions', views: 892, avgTime: '3m 12s' },
		{ route: '/analytics', views: 654, avgTime: '4m 45s' },
		{ route: '/upload', views: 423, avgTime: '1m 28s' },
		{ route: '/profile', views: 312, avgTime: '1m 56s' }
	];

	// User activity over time
	const { data: dailyLogins } = await admin
		.from('profiles')
		.select('created_at')
		.gte('created_at', last30d.toISOString())
		.order('created_at', { ascending: true });

	// Session uploads over time
	const { data: dailyUploads } = await admin
		.from('sessions')
		.select('timestamp')
		.gte('timestamp', last30d.toISOString())
		.order('timestamp', { ascending: true});

	// Error tracking (mock - you'd use Sentry or similar)
	const recentErrors = [
		{
			message: 'Failed to parse JSON file',
			count: 12,
			lastSeen: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
			route: '/api/upload'
		},
		{
			message: 'Session not found',
			count: 8,
			lastSeen: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
			route: '/sessions/[id]'
		},
		{
			message: 'Unauthorized access attempt',
			count: 5,
			lastSeen: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
			route: '/admin'
		}
	];

	// Performance metrics (mock)
	const performanceMetrics = {
		avgPageLoad: 1.2, // seconds
		avgApiResponse: 234, // ms
		p95PageLoad: 2.8,
		p95ApiResponse: 456
	};

	// Browser/device stats
	const { count: totalUsers } = await admin
		.from('profiles')
		.select('*', { count: 'exact', head: true });

	// Load insight feedback for analytics
	// NOTE: After running migration, the TypeScript error will resolve (see FEEDBACK_SYSTEMS_EXPLAINED.md)
	const { data: insightFeedbackRaw } = await admin
		.from('insight_feedback')
		.select('insight_type, content, response, detail_level, created_at')
		.order('timestamp', { ascending: false })
		.limit(1000);

	// Transform snake_case database columns to camelCase for TypeScript types
	const insightFeedback = (insightFeedbackRaw || []).map((record: any) => ({
		insightType: record.insight_type,
		content: record.content,
		response: record.response as 'useful' | 'not-useful' | 'confusing',
		detailLevel: record.detail_level as 'grom' | 'rider' | 'elite' | 'coach',
		createdAt: record.created_at
	}));

	return {
		pageViews,
		dailyLogins: dailyLogins || [],
		dailyUploads: dailyUploads || [],
		recentErrors,
		performanceMetrics,
		totalUsers: totalUsers || 0,
		insightFeedback,
		lastUpdated: now.toISOString()
	};
};

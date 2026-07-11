import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const admin = createSupabaseAdminClient();

	// Get time range from query params (default to last 30 days)
	const daysParam = url.searchParams.get('days') || '30';
	const days = parseInt(daysParam);
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	// Load all feedback within time range
	const { data: feedbackRecords, error } = await admin
		.from('insight_feedback')
		.select('*')
		.gte('timestamp', startDate.toISOString())
		.order('timestamp', { ascending: false });

	if (error) {
		console.error('Error loading feedback:', error);
	}

	// Transform to camelCase for TypeScript
	const insights = (feedbackRecords || []).map((record: any) => ({
		id: record.id,
		insightType: record.insight_type,
		content: record.content,
		response: record.response as 'useful' | 'not-useful' | 'confusing',
		detailLevel: record.detail_level as 'grom' | 'rider' | 'elite' | 'coach' | null,
		riderId: record.rider_id,
		sessionId: record.session_id,
		context: record.context,
		comment: record.comment,
		timestamp: record.timestamp,
		createdAt: record.created_at
	}));

	// Get user info for records with rider_id
	const riderIds = [...new Set(insights.map((i) => i.riderId).filter(Boolean))];
	let userMap: Record<string, { email: string; name: string | null }> = {};

	if (riderIds.length > 0) {
		const { data: profiles } = await admin
			.from('profiles')
			.select('id, email, full_name')
			.in('id', riderIds);

		userMap = (profiles || []).reduce(
			(acc, p: any) => {
				acc[p.id] = { email: p.email, name: p.full_name };
				return acc;
			},
			{} as Record<string, { email: string; name: string | null }>
		);
	}

	// Calculate time-based metrics
	const last7Days = new Date();
	last7Days.setDate(last7Days.getDate() - 7);

	const recentFeedback = insights.filter((i) => new Date(i.timestamp) >= last7Days);
	const olderFeedback = insights.filter((i) => new Date(i.timestamp) < last7Days);

	return {
		insights,
		userMap,
		timeRange: days,
		stats: {
			total: insights.length,
			recent: recentFeedback.length,
			older: olderFeedback.length,
			uniqueUsers: riderIds.length
		}
	};
};

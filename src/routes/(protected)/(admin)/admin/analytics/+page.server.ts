import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const admin = createSupabaseAdminClient();

	const now = new Date();
	const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const [
		pageViewsResult,
		recentErrorsResult,
		perfMetricsResult,
		dailyLoginsResult,
		dailyUploadsResult,
		totalUsersResult,
		insightFeedbackResult
	] = await Promise.all([
		// Page views: all events in last 30 days — aggregated below in JS
		admin
			.from('page_view_events')
			.select('route, duration_ms')
			.gte('created_at', last30d.toISOString()),

		// Recent errors: last 100 in last 7 days — de-duped below in JS
		admin
			.from('error_events')
			.select('route, status_code, severity, message, created_at')
			.gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
			.order('created_at', { ascending: false })
			.limit(100),

		// Performance metrics from the live view (last 24 h p50/p95/avg)
		admin.from('admin_perf_metrics').select('p50_ms, p95_ms, avg_ms, request_count').single(),

		// Daily logins (profile creation as proxy for new users)
		admin
			.from('profiles')
			.select('created_at')
			.gte('created_at', last30d.toISOString())
			.order('created_at', { ascending: true }),

		// Daily uploads
		admin
			.from('sessions')
			.select('timestamp')
			.gte('timestamp', last30d.toISOString())
			.order('timestamp', { ascending: true }),

		// Total user count
		admin.from('profiles').select('*', { count: 'exact', head: true }),

		// Insight feedback
		admin
			.from('insight_feedback')
			.select('insight_type, content, response, detail_level, created_at')
			.order('created_at', { ascending: false })
			.limit(1000)
	]);

	// Aggregate page views: group by route, count hits, average duration
	const rawViews = pageViewsResult.data ?? [];
	const routeMap = new Map<string, { count: number; totalMs: number; validMs: number }>();
	for (const row of rawViews) {
		const entry = routeMap.get(row.route) ?? { count: 0, totalMs: 0, validMs: 0 };
		entry.count++;
		if (typeof row.duration_ms === 'number') {
			entry.totalMs += row.duration_ms;
			entry.validMs++;
		}
		routeMap.set(row.route, entry);
	}

	const pageViews = Array.from(routeMap.entries())
		.map(([route, { count, totalMs, validMs }]) => ({
			route,
			views: count,
			avgTime: validMs > 0 ? formatDuration(totalMs / validMs) : null
		}))
		.sort((a, b) => b.views - a.views)
		.slice(0, 20);

	// Aggregate errors: group by message+route, count occurrences, track last seen
	const rawErrors = recentErrorsResult.data ?? [];
	const errorMap = new Map<
		string,
		{
			message: string;
			route: string;
			status_code: number;
			severity: string;
			count: number;
			lastSeen: string;
		}
	>();
	for (const row of rawErrors) {
		const key = `${row.route}::${row.message}`;
		const entry = errorMap.get(key);
		if (!entry) {
			errorMap.set(key, {
				message: row.message,
				route: row.route,
				status_code: row.status_code,
				severity: row.severity,
				count: 1,
				lastSeen: row.created_at
			});
		} else {
			entry.count++;
			if (row.created_at > entry.lastSeen) entry.lastSeen = row.created_at;
		}
	}

	const recentErrors = Array.from(errorMap.values())
		.sort((a, b) => b.count - a.count)
		.slice(0, 20);

	// Performance metrics from the view
	const pm = perfMetricsResult.data;
	const performanceMetrics = {
		avgPageLoad: pm?.avg_ms != null ? pm.avg_ms / 1000 : null,
		p50PageLoad: pm?.p50_ms != null ? pm.p50_ms / 1000 : null,
		p95PageLoad: pm?.p95_ms != null ? pm.p95_ms / 1000 : null,
		requestCount: pm?.request_count ?? 0
	};

	const insightFeedback = (insightFeedbackResult.data ?? []).map((record: any) => ({
		insightType: record.insight_type,
		content: record.content,
		response: record.response as 'useful' | 'not-useful' | 'confusing',
		detailLevel: record.detail_level as 'grom' | 'rider' | 'elite' | 'coach',
		createdAt: record.created_at
	}));

	return {
		pageViews,
		dailyLogins: dailyLoginsResult.data ?? [],
		dailyUploads: dailyUploadsResult.data ?? [],
		recentErrors,
		performanceMetrics,
		totalUsers: totalUsersResult.count ?? 0,
		insightFeedback,
		lastUpdated: now.toISOString()
	};
};

function formatDuration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const s = ms / 1000;
	if (s < 60) return `${s.toFixed(1)}s`;
	const m = Math.floor(s / 60);
	return `${m}m ${Math.round(s % 60)
		.toString()
		.padStart(2, '0')}s`;
}

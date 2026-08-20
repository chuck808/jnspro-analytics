import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { buildSessionSummary } from '$lib/server/sessionSummaryBuilder';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { reconcilePerformanceSnapshot } from '$lib/server/reconcilePerformanceSnapshot';

type SortDirection = 'asc' | 'desc';

export const load: PageServerLoad = async ({ locals: { supabase }, parent, url }) => {
	const { profile } = await parent();
	if (!profile) {
		return {
			sessions: [],
			totalCount: 0,
			page: 1,
			perPage: 10,
			dateFrom: null,
			dateTo: null,
			sortDir: 'desc' as const
		};
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const requestedPerPage = parseInt(url.searchParams.get('perPage') ?? '10');
	const perPage = [5, 10, 20, 50].includes(requestedPerPage) ? requestedPerPage : 10;
	const dateFrom = url.searchParams.get('dateFrom') || null;
	const dateTo = url.searchParams.get('dateTo') || null;
	const sortDir: SortDirection = url.searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

	let query = supabase
		.from('sessions')
		.select(
			`
			id,
			session_type,
			timestamp,
			notes,
			archived,
			bikes(name),
			runs(
				id,
				tags,
				elapsed_time_ms,
				distance_m,
				gate_runs(
					reaction_time_ms,
					max_g,
					peak_speed_ms,
					analytics_valid
				)
			)
		`,
			{ count: 'exact' }
		)
		.eq('user_id', profile.id)
		.eq('archived', false);

	if (dateFrom) query = query.gte('timestamp', dateFrom);
	if (dateTo) {
		const endDate = new Date(dateTo);
		endDate.setDate(endDate.getDate() + 1);
		query = query.lt('timestamp', endDate.toISOString());
	}

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	const { data: sessions, error, count } = await query
		.order('timestamp', { ascending: sortDir === 'asc' })
		.range(from, to);

	if (error) {
		console.error('Sessions load error:', error);
		return { sessions: [], totalCount: 0, page, perPage, dateFrom, dateTo, sortDir };
	}

	const sessionsWithStats = (sessions ?? []).map((session: any) => {
		const summary = buildSessionSummary({
			id: session.id,
			timestamp: session.timestamp,
			runs: session.runs ?? []
		} as any);

		return {
			id: session.id,
			session_type: session.session_type,
			timestamp: session.timestamp,
			notes: session.notes,
			bike_name: Array.isArray(session.bikes) ? session.bikes[0]?.name ?? null : session.bikes?.name ?? null,
			recorded_run_count: session.runs?.length ?? 0,
			run_count: summary?.run_count ?? 0,
			best_reaction_ms: summary?.best_reaction_ms ?? null,
			best_peak_speed_ms: summary?.best_peak_speed_ms ?? null,
			best_max_g: summary?.best_max_g ?? null,
			reaction_cv: summary?.reaction_cv ?? null,
			has_valid_speed: summary?.has_valid_speed ?? false
		};
	});

	return {
		sessions: sessionsWithStats,
		totalCount: count ?? 0,
		page,
		perPage,
		dateFrom,
		dateTo,
		sortDir
	};
};

export const actions: Actions = {
	deleteSession: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const sessionId = formData.get('sessionId') as string;
		if (!sessionId) return fail(400, { message: 'Session ID required' });

		const { data: session } = await supabase
			.from('sessions')
			.select('id')
			.eq('id', sessionId)
			.eq('user_id', user.id)
			.single();

		if (!session) return fail(404, { message: 'Session not found or access denied' });

		const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
		if (error) {
			console.error('Delete session error:', error);
			return fail(500, { message: 'Failed to delete session' });
		}

		try {
			await reconcilePerformanceSnapshot(createSupabaseAdminClient(), user.id);
		} catch (reconcileError) {
			console.warn('[Session delete] Derived-state reconciliation failed:', reconcileError);
		}

		return { success: true };
	}
};

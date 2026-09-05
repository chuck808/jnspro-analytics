import type { PageServerLoad } from './$types';
import { buildSessionSummary } from '$lib/server/sessionSummaryBuilder';
import { getExclusionReasons, type RunTag } from '$lib/types/runs';
import {
	getWeatherMeta,
	getSurfaceMeta,
	getFocusMeta,
	getRideFeelMeta,
	type WeatherCondition,
	type TrackSurface,
	type SessionFocus,
	type RideFeel
} from '$lib/types/sessionContext';

// Parallel Sessions list preview. Reuses the same summary computation, tag
// taxonomy and session-context label helpers the production app already
// owns (buildSessionSummary, getExclusionReasons, sessionContext.ts) rather
// than inventing new metrics or new label copy — the loader adds only the
// raw context columns the mock-up gate needs on top of what the existing
// /sessions loader already selects.
export { actions } from '../sessions/+page.server';

type SortDirection = 'asc' | 'desc';

// Matches the approved mock-up's single-line context reading, built from the
// canonical Title-Case labels already used by SessionContextEditor.svelte —
// not the sentence-style fragments in performance-engine/language/phrases.ts,
// which is a distinct, narrative-only register.
function buildContextLine(session: {
	weather_conditions: string | null;
	track_surface: string | null;
	session_focus: string | null;
	ride_feel: string | null;
}): string | null {
	const parts = [
		getSurfaceMeta(session.track_surface as TrackSurface | null)?.label,
		getWeatherMeta(session.weather_conditions as WeatherCondition | null)?.label,
		getFocusMeta(session.session_focus as SessionFocus | null)?.label,
		getRideFeelMeta(session.ride_feel as RideFeel | null)?.label
	].filter((label): label is string => Boolean(label));

	return parts.length > 0 ? parts.join(' · ') : null;
}

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
			weather_conditions,
			track_surface,
			session_focus,
			ride_feel,
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
		console.error('Sessions-next load error:', error);
		return { sessions: [], totalCount: 0, page, perPage, dateFrom, dateTo, sortDir };
	}

	const sessionsWithStats = (sessions ?? []).map((session: any) => {
		const summary = buildSessionSummary({
			id: session.id,
			timestamp: session.timestamp,
			runs: session.runs ?? []
		} as any);

		const excludedReasons = new Set<string>();
		let excludedCount = 0;
		for (const run of session.runs ?? []) {
			const reasons = getExclusionReasons((run.tags ?? null) as RunTag[] | null);
			if (reasons.length > 0) {
				excludedCount += 1;
				reasons.forEach((reason) => excludedReasons.add(reason));
			}
		}

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
			has_valid_speed: summary?.has_valid_speed ?? false,
			contextLine: buildContextLine(session),
			excludedCount,
			excludedReasons: Array.from(excludedReasons)
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

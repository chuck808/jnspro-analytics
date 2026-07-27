/**
 * Research Data Export API
 *
 * GET /api/admin/research-export?level=session|run&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns a CSV of anonymised session or run data for consented riders.
 * Admin-only. Uses service-role client.
 *
 * Anonymisation:
 *   - rider_id is the Supabase UUID — no name, email, or contact details
 *   - country is included (aggregated at country level is acceptable)
 *   - club and team are excluded
 *   - date_of_birth is excluded — age_at_session is derived and included instead
 *
 * Two export levels:
 *   session — one row per session, aggregate metrics (default)
 *   run     — one row per individual run, full gate_runs metrics
 *             (larger file, for biomechanics analysis)
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { requireAdmin } from '$lib/server/adminAuth';

export const GET: RequestHandler = async ({ url, locals }) => {
	await requireAdmin(locals.user?.id, locals.supabase);
	const adminUserId = locals.user!.id;

	const level = url.searchParams.get('level') ?? 'session';
	const from = url.searchParams.get('from') ?? null;
	const to = url.searchParams.get('to') ?? null;

	if (level !== 'session' && level !== 'run') {
		throw error(400, 'level must be "session" or "run"');
	}

	const admin = createSupabaseAdminClient();

	if (level === 'session') {
		return sessionExport(admin, adminUserId, from, to);
	} else {
		return runExport(admin, adminUserId, from, to);
	}
};

// ── Audit logging ──────────────────────────────────────────────────────────────

async function logExport(
	admin: ReturnType<typeof createSupabaseAdminClient>,
	adminId: string,
	level: 'session' | 'run',
	from: string | null,
	to: string | null,
	rowCount: number
): Promise<void> {
	const { error: logErr } = await admin.from('admin_export_log').insert({
		admin_id: adminId,
		export_level: level,
		date_from: from,
		date_to: to,
		row_count: rowCount
	});
	// Don't fail the export if logging fails — the export itself is more
	// important to the requester than the audit trail.
	if (logErr) console.error('Failed to log research export:', logErr);
}

// ── Session-level export ──────────────────────────────────────────────────────

async function sessionExport(
	admin: ReturnType<typeof createSupabaseAdminClient>,
	adminId: string,
	from: string | null,
	to: string | null
): Promise<Response> {
	// Fetch consented riders with their latest rider profile and active bike
	const { data: riders, error: ridersErr } = await admin
		.from('profiles')
		.select(
			`
			id,
			country,
			participation_type,
			research_consent_at,
			rider_profiles(
				height_cm, weight_kg, sex, years_racing, dominant_leg, date_of_birth,
				effective_from
			)
		`
		)
		.eq('research_consent', true)
		.not('participation_type', 'is', null);

	if (ridersErr) throw error(500, ridersErr.message);

	const riderIds = (riders ?? []).map((r) => r.id);
	if (riderIds.length === 0) {
		await logExport(admin, adminId, 'session', from, to, 0);
		return csvResponse('No consented riders found.', 'research_sessions.csv');
	}

	// Fetch sessions with context and stats for these riders
	let sessionQuery = admin
		.from('sessions')
		.select(
			`
			id, user_id, timestamp, session_type,
			weather_conditions, track_surface, session_focus, ride_feel,
			bikes(
				crank_length_mm, chainring_teeth, sprocket_teeth,
				custom_wheel_diameter_inches,
				rear_tire:tire_library!bikes_rear_tire_id_fkey(diameter_inches)
			)
		`
		)
		.in('user_id', riderIds)
		.eq('session_type', 'gate')
		.eq('archived', false)
		.order('timestamp', { ascending: true });

	if (from) sessionQuery = (sessionQuery as any).gte('timestamp', from);
	if (to) sessionQuery = (sessionQuery as any).lte('timestamp', to + 'T23:59:59');

	const { data: sessions, error: sessErr } = await sessionQuery;
	if (sessErr) throw error(500, sessErr.message);

	const sessionIds = (sessions ?? []).map((s) => s.id);

	// Fetch run stats per session (stats-eligible runs only — tags filtered below)
	const { data: runs } = await admin
		.from('runs')
		.select('session_id, tags, gate_runs(reaction_time_ms, max_g, peak_speed_ms, analytics_valid)')
		.in('session_id', sessionIds);

	// Build per-session stats
	const sessionStats = buildSessionStats(runs ?? []);

	// Build rider map (latest profile per rider)
	const riderMap = buildRiderMap(riders ?? []);

	// Assemble rows
	const headers = [
		'rider_id',
		'uci_category',
		'age_at_session',
		'sex',
		'height_cm',
		'weight_kg',
		'years_racing',
		'dominant_leg',
		'participation_type',
		'country',
		'session_date',
		'track_surface',
		'weather_condition',
		'session_focus',
		'ride_feel',
		'crank_length_mm',
		'chainring_teeth',
		'sprocket_teeth',
		'gear_ratio',
		'wheel_diameter_inches',
		'run_count',
		'stats_eligible_runs',
		'best_reaction_ms',
		'avg_reaction_ms',
		'reaction_cv_pct',
		'best_max_g',
		'avg_max_g',
		'best_peak_speed_ms',
		'valid_speed_runs'
	];

	const rows: string[][] = [];

	for (const session of sessions ?? []) {
		const rider = riderMap[session.user_id];
		if (!rider) continue;

		const stats = sessionStats[session.id] ?? {};
		const bike = session.bikes as any;
		const sessionDate = new Date(session.timestamp);

		const wheelDiameter =
			bike?.custom_wheel_diameter_inches ?? (bike?.rear_tire as any)?.diameter_inches ?? null;

		const gearRatio =
			bike?.chainring_teeth && bike?.sprocket_teeth
				? (bike.chainring_teeth / bike.sprocket_teeth).toFixed(3)
				: '';

		rows.push([
			session.user_id,
			rider.uciCategory ?? '',
			rider.ageAtDate(sessionDate)?.toString() ?? '',
			rider.sex ?? '',
			rider.height_cm?.toString() ?? '',
			rider.weight_kg?.toString() ?? '',
			rider.years_racing?.toString() ?? '',
			rider.dominant_leg ?? '',
			(session as any).participation_type ?? rider.participationType ?? '',
			rider.country ?? '',
			sessionDate.toISOString().split('T')[0],
			(session as any).track_surface ?? '',
			(session as any).weather_conditions ?? '',
			(session as any).session_focus ?? '',
			(session as any).ride_feel ?? '',
			bike?.crank_length_mm?.toString() ?? '',
			bike?.chainring_teeth?.toString() ?? '',
			bike?.sprocket_teeth?.toString() ?? '',
			gearRatio,
			wheelDiameter?.toString() ?? '',
			stats.totalRuns?.toString() ?? '',
			stats.eligibleRuns?.toString() ?? '',
			stats.bestReactionMs?.toFixed(1) ?? '',
			stats.avgReactionMs?.toFixed(1) ?? '',
			stats.reactionCvPct?.toFixed(2) ?? '',
			stats.bestMaxG?.toFixed(3) ?? '',
			stats.avgMaxG?.toFixed(3) ?? '',
			stats.bestPeakSpeedMs?.toFixed(3) ?? '',
			stats.validSpeedRuns?.toString() ?? ''
		]);
	}

	const csv = [headers, ...rows]
		.map((row) => row.map((cell) => csvCell(cell)).join(','))
		.join('\n');

	await logExport(admin, adminId, 'session', from, to, rows.length);

	const filename = `appgatepro_research_sessions_${dateStamp()}.csv`;
	return csvResponse(csv, filename);
}

// ── Run-level export ──────────────────────────────────────────────────────────

async function runExport(
	admin: ReturnType<typeof createSupabaseAdminClient>,
	adminId: string,
	from: string | null,
	to: string | null
): Promise<Response> {
	const { data: riders } = await admin
		.from('profiles')
		.select(
			'id, country, participation_type, rider_profiles(height_cm, weight_kg, sex, years_racing, dominant_leg, date_of_birth, effective_from)'
		)
		.eq('research_consent', true)
		.not('participation_type', 'is', null);

	const riderIds = (riders ?? []).map((r) => r.id);
	if (riderIds.length === 0) {
		await logExport(admin, adminId, 'run', from, to, 0);
		return csvResponse('No consented riders found.', 'research_runs.csv');
	}

	let sessionQuery = admin
		.from('sessions')
		.select('id, user_id, timestamp, track_surface, weather_conditions, session_focus, ride_feel')
		.in('user_id', riderIds)
		.eq('session_type', 'gate')
		.eq('archived', false);

	if (from) sessionQuery = (sessionQuery as any).gte('timestamp', from);
	if (to) sessionQuery = (sessionQuery as any).lte('timestamp', to + 'T23:59:59');

	const { data: sessions, error: sessErr } = await sessionQuery;
	if (sessErr) throw error(500, sessErr.message);

	const sessionIds = (sessions ?? []).map((s) => s.id);

	const { data: runs } = await admin
		.from('runs')
		.select(
			`
			id, session_id, run_number, elapsed_time_ms, distance_m, tags,
			gate_runs(
				reaction_time_ms, max_g, avg_g,
				speed_ms, peak_speed_ms, avg_speed_ms_calc,
				time_to_peak_speed_ms, bias_correction_ms2, analytics_valid,
				max_pitch_deg, avg_pitch_deg, pitch_at_peak_g_deg,
				time_to_wheelie_ms, wheelie_duration_ms, front_wheel_lifted
			)
		`
		)
		.in('session_id', sessionIds)
		.order('session_id')
		.order('run_number');

	const riderMap = buildRiderMap(riders ?? []);
	const sessionMap = (sessions ?? []).reduce<Record<string, any>>((acc, s) => {
		acc[s.id] = s;
		return acc;
	}, {});

	const headers = [
		'rider_id',
		'uci_category',
		'age_at_session',
		'sex',
		'height_cm',
		'weight_kg',
		'years_racing',
		'dominant_leg',
		'participation_type',
		'country',
		'session_date',
		'run_number',
		'is_stats_eligible',
		'track_surface',
		'weather_condition',
		'session_focus',
		'ride_feel',
		'elapsed_time_ms',
		'distance_m',
		'reaction_time_ms',
		'max_g',
		'avg_g',
		'speed_ms',
		'peak_speed_ms',
		'avg_speed_ms_calc',
		'time_to_peak_speed_ms',
		'bias_correction_ms2',
		'analytics_valid',
		'max_pitch_deg',
		'avg_pitch_deg',
		'pitch_at_peak_g_deg',
		'time_to_wheelie_ms',
		'wheelie_duration_ms',
		'front_wheel_lifted'
	];

	const rows: string[][] = [];

	for (const run of runs ?? []) {
		const session = sessionMap[run.session_id];
		if (!session) continue;

		const rider = riderMap[session.user_id];
		if (!rider) continue;

		const tags: string[] = Array.isArray(run.tags) ? run.tags : [];
		const isEligible = !tags.includes('warmup') && !tags.includes('exclude');

		const g = Array.isArray(run.gate_runs) ? run.gate_runs[0] : run.gate_runs;
		const sessionDate = new Date(session.timestamp);

		rows.push([
			session.user_id,
			rider.uciCategory ?? '',
			rider.ageAtDate(sessionDate)?.toString() ?? '',
			rider.sex ?? '',
			rider.height_cm?.toString() ?? '',
			rider.weight_kg?.toString() ?? '',
			rider.years_racing?.toString() ?? '',
			rider.dominant_leg ?? '',
			rider.participationType ?? '',
			rider.country ?? '',
			sessionDate.toISOString().split('T')[0],
			run.run_number?.toString() ?? '',
			isEligible ? 'true' : 'false',
			session.track_surface ?? '',
			session.weather_conditions ?? '',
			session.session_focus ?? '',
			session.ride_feel ?? '',
			run.elapsed_time_ms?.toString() ?? '',
			run.distance_m?.toString() ?? '',
			g?.reaction_time_ms?.toString() ?? '',
			g?.max_g?.toFixed(4) ?? '',
			g?.avg_g?.toFixed(4) ?? '',
			g?.speed_ms?.toFixed(4) ?? '',
			g?.peak_speed_ms?.toFixed(4) ?? '',
			g?.avg_speed_ms_calc?.toFixed(4) ?? '',
			g?.time_to_peak_speed_ms?.toString() ?? '',
			g?.bias_correction_ms2?.toFixed(4) ?? '',
			g?.analytics_valid ? 'true' : 'false',
			g?.max_pitch_deg?.toFixed(2) ?? '',
			g?.avg_pitch_deg?.toFixed(2) ?? '',
			g?.pitch_at_peak_g_deg?.toFixed(2) ?? '',
			g?.time_to_wheelie_ms?.toString() ?? '',
			g?.wheelie_duration_ms?.toString() ?? '',
			g?.front_wheel_lifted ? 'true' : 'false'
		]);
	}

	const csv = [headers, ...rows]
		.map((row) => row.map((cell) => csvCell(cell)).join(','))
		.join('\n');

	await logExport(admin, adminId, 'run', from, to, rows.length);

	const filename = `appgatepro_research_runs_${dateStamp()}.csv`;
	return csvResponse(csv, filename);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSessionStats(runs: any[]): Record<
	string,
	{
		totalRuns: number;
		eligibleRuns: number;
		bestReactionMs: number | null;
		avgReactionMs: number | null;
		reactionCvPct: number | null;
		bestMaxG: number | null;
		avgMaxG: number | null;
		bestPeakSpeedMs: number | null;
		validSpeedRuns: number;
	}
> {
	const map: Record<string, any> = {};

	for (const run of runs) {
		if (!map[run.session_id]) {
			map[run.session_id] = { all: [], eligible: [] };
		}
		const tags: string[] = Array.isArray(run.tags) ? run.tags : [];
		const isEligible = !tags.includes('warmup') && !tags.includes('exclude');
		const gates = Array.isArray(run.gate_runs)
			? run.gate_runs
			: run.gate_runs
				? [run.gate_runs]
				: [];
		map[run.session_id].all.push(...gates);
		if (isEligible) map[run.session_id].eligible.push(...gates);
	}

	const result: Record<string, any> = {};
	for (const [sessionId, { all, eligible }] of Object.entries(map) as any[]) {
		const reactions = eligible.map((g: any) => g.reaction_time_ms).filter((v: any) => v != null);
		const gForces = eligible.map((g: any) => g.max_g).filter((v: any) => v != null);
		const speeds = eligible
			.filter((g: any) => g.analytics_valid)
			.map((g: any) => g.peak_speed_ms)
			.filter((v: any) => v != null);

		const avgReaction = reactions.length
			? reactions.reduce((a: number, b: number) => a + b, 0) / reactions.length
			: null;
		const reactionCv =
			reactions.length >= 3 && avgReaction
				? (Math.sqrt(
						reactions
							.map((v: number) => (v - avgReaction) ** 2)
							.reduce((a: number, b: number) => a + b, 0) / reactions.length
					) /
						avgReaction) *
					100
				: null;

		result[sessionId] = {
			totalRuns: all.length,
			eligibleRuns: eligible.length,
			bestReactionMs: reactions.length ? Math.min(...reactions) : null,
			avgReactionMs: avgReaction,
			reactionCvPct: reactionCv,
			bestMaxG: gForces.length ? Math.max(...gForces) : null,
			avgMaxG: gForces.length
				? gForces.reduce((a: number, b: number) => a + b, 0) / gForces.length
				: null,
			bestPeakSpeedMs: speeds.length ? Math.max(...speeds) : null,
			validSpeedRuns: speeds.length
		};
	}
	return result;
}

interface RiderContext {
	sex: string | null;
	height_cm: number | null;
	weight_kg: number | null;
	years_racing: number | null;
	dominant_leg: string | null;
	country: string | null;
	participationType: string | null;
	uciCategory: string | null;
	ageAtDate: (date: Date) => number | null;
}

function buildRiderMap(riders: any[]): Record<string, RiderContext> {
	const map: Record<string, RiderContext> = {};

	for (const rider of riders) {
		// Pick the latest rider_profile snapshot
		const profiles: any[] = Array.isArray(rider.rider_profiles)
			? rider.rider_profiles
			: rider.rider_profiles
				? [rider.rider_profiles]
				: [];

		const latest = profiles.sort(
			(a: any, b: any) =>
				new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
		)[0];

		const dob = latest?.date_of_birth ? new Date(latest.date_of_birth) : null;

		// UCI category from DOB using the same logic as getUCICategory()
		const uciCategory = dob ? deriveUCICategory(dob) : null;

		map[rider.id] = {
			sex: latest?.sex ?? null,
			height_cm: latest?.height_cm ?? null,
			weight_kg: latest?.weight_kg ?? null,
			years_racing: latest?.years_racing ?? null,
			dominant_leg: latest?.dominant_leg ?? null,
			country: rider.country ?? null,
			participationType: rider.participation_type ?? null,
			uciCategory,
			ageAtDate: (date: Date) => {
				if (!dob) return null;
				let age = date.getFullYear() - dob.getFullYear();
				const m = date.getMonth() - dob.getMonth();
				if (m < 0 || (m === 0 && date.getDate() < dob.getDate())) age--;
				return age;
			}
		};
	}
	return map;
}

function deriveUCICategory(dob: Date): string {
	const age = new Date().getFullYear() - dob.getFullYear();
	if (age <= 4) return 'Balance';
	if (age <= 5) return 'Strider';
	if (age <= 7) return 'Mini';
	if (age <= 10) return 'Cadet';
	if (age <= 12) return 'Junior';
	if (age <= 14) return 'Youth';
	if (age <= 16) return 'Challenger';
	if (age <= 18) return 'Junior Elite';
	if (age <= 29) return 'Elite';
	if (age <= 39) return 'Masters 30+';
	if (age <= 49) return 'Masters 40+';
	return 'Masters 50+';
}

function csvCell(value: string): string {
	if (value === null || value === undefined) return '';
	const s = String(value);
	// Quote cells that contain commas, quotes, or newlines
	if (s.includes(',') || s.includes('"') || s.includes('\n')) {
		return '"' + s.replace(/"/g, '""') + '"';
	}
	return s;
}

function csvResponse(csv: string, filename: string): Response {
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store'
		}
	});
}

function dateStamp(): string {
	return new Date().toISOString().split('T')[0];
}

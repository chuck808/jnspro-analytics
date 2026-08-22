import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { refreshPerformanceAggregates } from '$lib/services/benchmarking';

export const load: PageServerLoad = async () => {
	const admin = createSupabaseAdminClient();

	const [thresholdsResult, aggregatesResult, populationResult] = await Promise.all([
		// Current threshold profiles
		admin.from('threshold_profiles').select('*').order('profile_level'),

		// Current aggregate distributions (for context panel)
		admin
			.from('performance_aggregates')
			.select('*')
			.eq('age_group', 'all')
			.eq('experience_level', 'all'),

		// Population stats — how many riders per level
		admin
			.from('rider_performance_snapshots')
			.select('experience_level, participation_type')
			.not('experience_level', 'is', null)
	]);

	const thresholds = thresholdsResult.data ?? [];
	const aggregates = aggregatesResult.data ?? [];
	const population = populationResult.data ?? [];

	// Summarise population by experience level
	const populationSummary = population.reduce<Record<string, number>>((acc, row) => {
		const key = row.experience_level ?? 'unknown';
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});

	// Map aggregates by metric for easy lookup
	const aggregatesByMetric = aggregates.reduce<Record<string, any>>((acc, row) => {
		acc[row.metric] = row;
		return acc;
	}, {});

	return {
		thresholds,
		aggregatesByMetric,
		populationSummary,
		totalRiders: population.length
	};
};

export const actions: Actions = {
	// Manual override of a specific profile level
	updateThreshold: async ({ request }) => {
		const admin = createSupabaseAdminClient();
		const form = await request.formData();

		const profileLevel = form.get('profile_level') as string;
		const notes = (form.get('notes') as string) || null;

		const fields = {
			reaction_ms_excellent: parseFloat(form.get('reaction_ms_excellent') as string),
			reaction_ms_good: parseFloat(form.get('reaction_ms_good') as string),
			reaction_ms_needs_work: parseFloat(form.get('reaction_ms_needs_work') as string),
			peak_g_good: parseFloat(form.get('peak_g_good') as string),
			peak_g_excellent: parseFloat(form.get('peak_g_excellent') as string),
			impulse_90_excellent: parseFloat(form.get('impulse_90_excellent') as string),
			impulse_90_good: parseFloat(form.get('impulse_90_good') as string),
			impulse_90_needs_work: parseFloat(form.get('impulse_90_needs_work') as string),
			smoothness_good: parseFloat(form.get('smoothness_good') as string),
			smoothness_excellent: parseFloat(form.get('smoothness_excellent') as string),
			speed_carry_good: parseFloat(form.get('speed_carry_good') as string),
			speed_carry_excellent: parseFloat(form.get('speed_carry_excellent') as string)
		};

		// Validate — no NaN values
		for (const [key, val] of Object.entries(fields)) {
			if (!Number.isFinite(val)) {
				return fail(400, { error: `Invalid value for ${key}` });
			}
		}

		// Determine source: if auto currently, mark as manual_override
		const { data: current } = await admin
			.from('threshold_profiles')
			.select('source')
			.eq('profile_level', profileLevel)
			.maybeSingle();

		const source = current?.source === 'auto' ? 'manual_override' : 'manual';

		const { error } = await admin
			.from('threshold_profiles')
			.update({ ...fields, source, notes, computed_at: new Date().toISOString() })
			.eq('profile_level', profileLevel);

		if (error) return fail(500, { error: error.message });
		return { updateSuccess: true, profileLevel };
	},

	// Reset a profile level back to auto-derivation
	resetToAuto: async ({ request }) => {
		const admin = createSupabaseAdminClient();
		const form = await request.formData();
		const profileLevel = form.get('profile_level') as string;

		// Mark as hardcoded — next refresh_performance_aggregates() call will
		// overwrite with auto if sufficient data exists
		const { error } = await admin
			.from('threshold_profiles')
			.update({
				source: 'hardcoded',
				notes: 'Reset to auto by admin — will update on next aggregate refresh',
				computed_at: new Date().toISOString()
			})
			.eq('profile_level', profileLevel);

		if (error) return fail(500, { error: error.message });
		return { resetSuccess: true, profileLevel };
	},

	// Manually trigger a refresh
	triggerRefresh: async () => {
		const admin = createSupabaseAdminClient();
		const refreshError = await refreshPerformanceAggregates(admin);
		if (refreshError) return fail(500, { error: refreshError });
		return { refreshSuccess: true };
	}
};

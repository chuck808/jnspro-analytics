import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const admin = createSupabaseAdminClient();

	const [consentedResult, totalResult, participationResult, sessionCountResult] = await Promise.all([
		// Consented riders with profile completeness
		admin
			.from('profiles')
			.select('id, country, participation_type, research_consent_at, rider_profiles(sex, height_cm, weight_kg, date_of_birth, years_racing, dominant_leg)')
			.eq('research_consent', true),

		// Total registered riders
		admin
			.from('profiles')
			.select('id', { count: 'exact', head: true }),

		// Breakdown by participation type (all riders)
		admin
			.from('profiles')
			.select('participation_type')
			.not('participation_type', 'is', null),

		// Session count for consented riders
		admin
			.from('sessions')
			.select('user_id', { count: 'exact', head: true })
			.eq('session_type', 'gate')
			.eq('archived', false),
	]);

	const consented = consentedResult.data ?? [];

	// Profile completeness for consented riders
	const completeness = consented.map(r => {
		const p = Array.isArray(r.rider_profiles) ? r.rider_profiles[0] : r.rider_profiles;
		return {
			hasSex:          !!p?.sex,
			hasHeight:       !!p?.height_cm,
			hasWeight:       !!p?.weight_kg,
			hasDob:          !!p?.date_of_birth,
			hasYearsRacing:  !!p?.years_racing,
			hasDominantLeg:  !!p?.dominant_leg,
			hasParticipation: !!r.participation_type,
			hasCountry:      !!r.country,
		};
	});

	const fieldCompleteness = {
		sex:           completeness.filter(c => c.hasSex).length,
		height:        completeness.filter(c => c.hasHeight).length,
		weight:        completeness.filter(c => c.hasWeight).length,
		dob:           completeness.filter(c => c.hasDob).length,
		yearsRacing:   completeness.filter(c => c.hasYearsRacing).length,
		dominantLeg:   completeness.filter(c => c.hasDominantLeg).length,
		participation: completeness.filter(c => c.hasParticipation).length,
		country:       completeness.filter(c => c.hasCountry).length,
	};

	// Participation type breakdown (consented only)
	const participationBreakdown = consented.reduce<Record<string, number>>((acc, r) => {
		const k = r.participation_type ?? 'not_set';
		acc[k] = (acc[k] ?? 0) + 1;
		return acc;
	}, {});

	// Country breakdown (consented only)
	const countryBreakdown = consented.reduce<Record<string, number>>((acc, r) => {
		const k = r.country ?? 'not_set';
		acc[k] = (acc[k] ?? 0) + 1;
		return acc;
	}, {});

	return {
		consentedCount:        consented.length,
		totalRiders:           totalResult.count ?? 0,
		totalSessions:         sessionCountResult.count ?? 0,
		fieldCompleteness,
		participationBreakdown,
		countryBreakdown,
		earliestConsent:       consented
			.map(r => r.research_consent_at)
			.filter(Boolean)
			.sort()[0] ?? null,
	};
};
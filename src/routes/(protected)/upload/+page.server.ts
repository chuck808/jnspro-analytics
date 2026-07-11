import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, parent }) => {
	const { profile } = await parent();
	if (!profile) return { profileComplete: false };

	// Check profile completeness for the warning banner
	const [riderProfileResult, bikeResult] = await Promise.all([
		supabase
			.from('rider_profiles')
			.select('weight_kg, height_cm, date_of_birth')
			.eq('user_id', profile.id)
			.order('effective_from', { ascending: false })
			.limit(1)
			.maybeSingle(),
		supabase
			.from('bikes')
			.select('crank_length_mm, rear_tire_id, custom_wheel_diameter_inches')
			.eq('user_id', profile.id)
			.eq('is_active', true)
			.maybeSingle()
	]);

	const riderProfile = riderProfileResult.data;
	const bike = bikeResult.data;

	const profileComplete =
		!!riderProfile?.weight_kg &&
		!!riderProfile?.height_cm &&
		!!bike?.crank_length_mm &&
		!!(bike?.rear_tire_id || bike?.custom_wheel_diameter_inches);

	return { profileComplete };
};

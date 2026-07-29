import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Gated on profiles.coach_status = 'approved' (admin review or direct
// grant — see src/lib/server/coachApplications.ts). This is NOT the old
// removed "must already have an active coach_rider_link" gate (that was a
// chicken-and-egg bug: you can't get a link without reaching this page
// first). coach_status is set entirely outside this route — via Settings
// or sign-up (application) or admin/users/[id] (direct grant) — so a
// first-time coach can become approved without ever having visited
// /coach, closing that loop safely.
export const load: LayoutServerLoad = async ({ parent }) => {
	const { profile } = await parent();
	if (!profile) throw redirect(303, '/auth/sign-in');
	if (profile.coach_status !== 'approved') throw redirect(303, '/settings');
	return {};
};

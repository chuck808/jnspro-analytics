import { requireAdminFromProfile } from '$lib/server/adminAuth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { profile } = await parent();
	requireAdminFromProfile(profile);
	return {};
};

import { requireAdminFromProfile } from '$lib/server/adminAuth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends, parent }) => {
	depends('admin:maintenance');

	const { profile } = await parent();
	requireAdminFromProfile(profile);

	const { data: schedules } = await locals.supabase
		.from('maintenance_schedules')
		.select('*')
		.order('start_time', { ascending: false });

	return {
		schedules: schedules || []
	};
};

import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { profile } = await parent();
	if (!profile) throw redirect(303, '/auth/sign-in');
	if (profile.role !== 'admin') throw error(403, 'Access denied');
	return {};
};

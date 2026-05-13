import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Redirect to analytics page (main performance dashboard)
    throw redirect(302, '/analytics');
};

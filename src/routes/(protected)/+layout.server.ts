import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession();

    if (!session || !user) {
        throw redirect(303, '/auth/sign-in');
    }

    // Get user profile from database
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { session, user, profile };
};

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, session, user } }) => {
    // Session and user are already validated by authGuard in hooks.server.ts
    // No need to call safeGetSession() again - just use the values from locals
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

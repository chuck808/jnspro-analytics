import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
    const { data: claimsData, error } = await supabase.auth.getClaims();
    
    // If no claims or error, redirect to sign-in
    if (error || !claimsData?.claims) {
        throw redirect(303, '/auth/sign-in');
    }

    const { claims } = claimsData;

    // Get user profile from database
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', claims.sub)
        .single();

    return { claims, profile };
};

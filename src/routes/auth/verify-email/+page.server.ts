import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    const { data: claimsData } = await supabase.auth.getClaims();
    return {
        isAuthenticated: !!claimsData?.claims
    };
};

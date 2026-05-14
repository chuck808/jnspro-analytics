import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    return {
        redirectTo: url.searchParams.get('redirectTo') ?? '/dashboard'
    };
};

export const actions: Actions = {
    default: async ({ request, locals, cookies, url }) => {
        const form = await request.formData();
        const email = form.get('email') as string;
        const password = form.get('password') as string;
        const redirectTo = form.get('redirectTo') as string ?? '/dashboard';

        if (!email || !password) {
            return fail(400, { error: 'Email and password are required' });
        }

        const { data, error } = await locals.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return fail(400, { error: error.message });
        }

        if (data.session) {
            await locals.supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            });
        }

        const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
        return { success: true, redirectTo: safeRedirect };
    }
};

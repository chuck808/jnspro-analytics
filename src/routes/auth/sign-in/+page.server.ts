import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    return {
        redirectTo: url.searchParams.get('redirectTo') ?? '/dashboard'
    };
};

export const actions: Actions = {
    default: async ({ request, locals, url }) => {
        const form = await request.formData();
        const email = form.get('email') as string;
        const password = form.get('password') as string;
        const redirectTo = form.get('redirectTo') as string ?? '/dashboard';

        if (!email || !password) {
            return fail(400, { error: 'Email and password are required' });
        }

        const { error } = await locals.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return fail(400, { error: error.message });
        }

        const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
        throw redirect(303, safeRedirect);
    }
};

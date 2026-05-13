import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ request, locals, url }) => {
        const form = await request.formData();
        const email = form.get('email') as string;
        const password = form.get('password') as string;
        const confirmPassword = form.get('confirmPassword') as string;
        const name = form.get('name') as string;

        if (!email || !password || !name) {
            return fail(400, { error: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return fail(400, { error: 'Passwords do not match' });
        }

        if (password.length < 8) {
            return fail(400, { error: 'Password must be at least 8 characters' });
        }

        const { error } = await locals.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
                emailRedirectTo: `${url.origin}/auth/verify-email`
            }
        });

        if (error) {
            return fail(400, { error: error.message });
        }

        return { success: true, email };
    }
};

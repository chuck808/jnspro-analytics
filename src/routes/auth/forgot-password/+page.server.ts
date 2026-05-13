import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ request, locals, url }) => {
        const form = await request.formData();
        const email = form.get('email') as string;

        if (!email) {
            return fail(400, { error: 'Email address is required' });
        }

        const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${url.origin}/auth/reset-password`
        });

        if (error) {
            return fail(400, { error: error.message });
        }

        // Always return success to prevent email enumeration
        return { success: true, email };
    }
};

import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const password = form.get('password') as string;
		const confirmPassword = form.get('confirmPassword') as string;

		if (!password) {
			return fail(400, { error: 'Password is required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { error: error.message });
		}

		throw redirect(303, '/dashboard');
	}
};

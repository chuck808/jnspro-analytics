import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { type, subject, description, email } = await request.json();

		// Validate required fields
		if (!type || !subject || !description) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Get user info if authenticated
		const { data: { user } } = await locals.supabase.auth.getUser();
		const userId = user?.id || null;
		const userEmail = user?.email || email || null;

		// Create admin client to insert feedback
		const supabaseAdmin = createSupabaseAdminClient();
		
		// Insert feedback into database
		const { error } = await supabaseAdmin
			.from('feedback')
			.insert({
				user_id: userId,
				type,
				subject,
				description,
				email: userEmail,
				created_at: new Date().toISOString()
			});

		if (error) {
			console.error('Error saving feedback:', error);
			return json({ error: 'Failed to save feedback' }, { status: 500 });
		}

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Feedback submission error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
	const session = await getSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user is admin
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.single();

	if (profile?.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { id } = body;

		const { error } = await supabase.from('help_faqs').delete().eq('id', id);

		if (error) {
			console.error('Error deleting FAQ:', error);
			return json({ error: 'Failed to delete FAQ' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

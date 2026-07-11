import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Unauthorized');
	}

	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	if (profile?.role !== 'admin') {
		throw error(403, 'Access denied. Admin privileges required.');
	}

	const body = await request.json();
	const { title, description, start_time, end_time } = body;

	const { data, error: dbError } = await locals.supabase
		.from('maintenance_schedules')
		.insert({
			title,
			description,
			start_time,
			end_time,
			created_by: locals.user?.id
		})
		.select()
		.single();

	if (dbError) {
		throw error(500, dbError.message);
	}

	return json(data);
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Unauthorized');
	}

	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	if (profile?.role !== 'admin') {
		throw error(403, 'Access denied. Admin privileges required.');
	}

	const body = await request.json();
	const { id, is_active } = body;

	const { data, error: dbError } = await locals.supabase
		.from('maintenance_schedules')
		.update({ is_active })
		.eq('id', id)
		.select()
		.single();

	if (dbError) {
		throw error(500, dbError.message);
	}

	return json(data);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Unauthorized');
	}

	// Check if user is admin
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', locals.user.id)
		.single();

	if (profile?.role !== 'admin') {
		throw error(403, 'Access denied. Admin privileges required.');
	}

	const body = await request.json();
	const { id } = body;

	const { error: dbError } = await locals.supabase
		.from('maintenance_schedules')
		.delete()
		.eq('id', id);

	if (dbError) {
		throw error(500, dbError.message);
	}

	return json({ success: true });
};

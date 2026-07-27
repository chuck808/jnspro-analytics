import { error, redirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

/**
 * Throws a 401/403 SvelteKit error if the given user isn't an admin.
 * SvelteKit's error() is caught uniformly whether called from a +server.ts
 * endpoint or a +page.server.ts load/action, so this covers both.
 */
export async function requireAdmin(
	userId: string | null | undefined,
	supabase: SupabaseClient<Database>
): Promise<void> {
	if (!userId) throw error(401, 'Unauthorized');

	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', userId)
		.single();

	if (profile?.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
}

/**
 * Same check, for load functions that already have the profile from a
 * parent layout's `await parent()` and don't need another DB round-trip.
 */
export function requireAdminFromProfile(profile: { role: string } | null | undefined): void {
	if (!profile) throw redirect(303, '/auth/sign-in');
	if (profile.role !== 'admin') throw error(403, 'Access denied');
}

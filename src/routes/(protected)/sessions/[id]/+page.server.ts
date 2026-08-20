/**
 * Server Actions for Session Detail Pages
 *
 * Note: These actions are available to all child routes (/, /analysis, /detail)
 * because they're defined at the parent route level.
 */

import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { reconcilePerformanceSnapshot } from '$lib/server/reconcilePerformanceSnapshot';

export const actions: Actions = {
	/**
	 * Update run tags
	 * Allows users to categorize runs (warmup, best-effort, etc.)
	 */
	updateRunTags: async ({ request, locals: { supabase, session } }) => {
		// Auth check — session is set by authGuard in hooks.server.ts
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const runId = data.get('runId') as string;
		const sessionId = data.get('sessionId') as string;
		const tagsJson = data.get('tags') as string;

		if (!runId || !sessionId) {
			return fail(400, { error: 'Missing runId or sessionId' });
		}

		let tags: string[];
		try {
			tags = JSON.parse(tagsJson);
		} catch {
			return fail(400, { error: 'Invalid tags format' });
		}

		// Verify the run belongs to a session owned by this user before updating.
		// The join ensures neither runId nor sessionId can be forged independently.
		const { data: ownership, error: ownershipError } = await supabase
			.from('runs')
			.select('id, sessions!inner(user_id)')
			.eq('id', runId)
			.eq('session_id', sessionId)
			.eq('sessions.user_id', session.user.id)
			.maybeSingle();

		if (ownershipError || !ownership) {
			return fail(403, { error: 'Run not found or access denied' });
		}

		const { error } = await supabase.from('runs').update({ tags }).eq('id', runId);

		if (error) {
			console.error('Error updating run tags:', error);
			return fail(500, { error: 'Failed to update run tags' });
		}

		// A tag change can alter PBs, percentile cohorts and leaderboard values immediately.
		// Rebuild the persisted benchmarking projection instead of waiting for another upload.
		try {
			await reconcilePerformanceSnapshot(createSupabaseAdminClient(), session.user.id);
		} catch (reconcileError) {
			console.warn('[Run tags] Performance snapshot reconciliation failed:', reconcileError);
		}

		return { success: true, runId, tags };
	},

	/**
	 * Update session context (weather, surface, focus)
	 */
	updateSessionContext: async ({ request, locals: { supabase, session } }) => {
		// Auth check — session is set by authGuard in hooks.server.ts
		if (!session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const data = await request.formData();
		const sessionId = data.get('sessionId') as string;
		const weather = data.get('weather') as string | null;
		const surface = data.get('surface') as string | null;
		const focus = data.get('focus') as string | null;
		const feel = data.get('feel') as string | null;

		if (!sessionId) {
			return fail(400, { error: 'Missing sessionId' });
		}

		// Update session context
		const { error } = await supabase
			.from('sessions')
			.update({
				weather_conditions: weather || null,
				track_surface: surface || null,
				session_focus: focus || null,
				ride_feel: feel || null
			})
			.eq('id', sessionId)
			.eq('user_id', session.user.id); // Security: Verify ownership

		if (error) {
			console.error('Error updating session context:', error);
			return fail(500, { error: 'Failed to update session context' });
		}

		return { success: true, sessionId };
	},

	// ========================================
	// Session Notes Actions
	// ========================================

	addNote: async ({ request, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const sessionId = data.get('session_id') as string;
		const noteType = data.get('note_type') as string;
		const content = data.get('content') as string;
		const authorRole = data.get('author_role') as string;

		if (!sessionId || !noteType || !content) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Verify session ownership
		const { data: sessionData } = await supabase
			.from('sessions')
			.select('user_id')
			.eq('id', sessionId)
			.single();

		if (!sessionData || sessionData.user_id !== session.user.id) {
			return fail(403, { error: 'Unauthorized' });
		}

		// Insert note
		const { error } = await supabase.from('session_notes').insert({
			session_id: sessionId,
			user_id: session.user.id,
			note_type: noteType,
			content,
			author_role: authorRole || null
		});

		if (error) {
			console.error('Error adding note:', error);
			return fail(500, { error: 'Failed to add note' });
		}

		return { success: true };
	},

	updateNote: async ({ request, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const noteId = data.get('note_id') as string;
		const content = data.get('content') as string;

		if (!noteId || !content) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Update note (RLS will ensure ownership)
		const { error } = await supabase
			.from('session_notes')
			.update({ content })
			.eq('id', noteId)
			.eq('user_id', session.user.id);

		if (error) {
			console.error('Error updating note:', error);
			return fail(500, { error: 'Failed to update note' });
		}

		return { success: true };
	},

	deleteNote: async ({ request, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const noteId = data.get('note_id') as string;

		if (!noteId) {
			return fail(400, { error: 'Missing note ID' });
		}

		// Delete note (RLS will ensure ownership)
		const { error } = await supabase
			.from('session_notes')
			.delete()
			.eq('id', noteId)
			.eq('user_id', session.user.id);

		if (error) {
			console.error('Error deleting note:', error);
			return fail(500, { error: 'Failed to delete note' });
		}

		return { success: true };
	}
};

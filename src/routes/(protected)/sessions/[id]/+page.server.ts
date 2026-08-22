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
import {
	isRideFeel,
	isSessionFocus,
	isTrackSurface,
	isWeatherCondition
} from '$lib/types/sessionContext';

export const actions: Actions = {
	/**
	 * Update run tags
	 * Allows users to categorize runs (warmup, best-effort, etc.)
	 */
	updateRunTags: async ({ request, locals: { supabase, session } }) => {
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

		try {
			await reconcilePerformanceSnapshot(createSupabaseAdminClient(), session.user.id);
		} catch (reconcileError) {
			console.warn('[Run tags] Performance snapshot reconciliation failed:', reconcileError);
		}

		return { success: true, runId, tags };
	},

	/**
	 * Update optional session context. Values are validated against the canonical
	 * UI taxonomy before they reach the database so forged/stale form values
	 * cannot silently create a second context vocabulary.
	 */
	updateSessionContext: async ({ request, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const sessionId = String(data.get('sessionId') ?? '').trim();
		const weatherRaw = data.get('weather');
		const surfaceRaw = data.get('surface');
		const focusRaw = data.get('focus');
		const feelRaw = data.get('feel');

		if (!sessionId) return fail(400, { error: 'Missing sessionId' });

		const weather = weatherRaw ? String(weatherRaw) : null;
		const surface = surfaceRaw ? String(surfaceRaw) : null;
		const focus = focusRaw ? String(focusRaw) : null;
		const feel = feelRaw ? String(feelRaw) : null;

		if (weather && !isWeatherCondition(weather)) {
			return fail(400, { error: 'Invalid weather condition' });
		}
		if (surface && !isTrackSurface(surface)) {
			return fail(400, { error: 'Invalid track surface' });
		}
		if (focus && !isSessionFocus(focus)) {
			return fail(400, { error: 'Invalid session focus' });
		}
		if (feel && !isRideFeel(feel)) {
			return fail(400, { error: 'Invalid ride feel' });
		}

		const { data: updatedSession, error } = await supabase
			.from('sessions')
			.update({
				weather_conditions: weather,
				track_surface: surface,
				session_focus: focus,
				ride_feel: feel
			})
			.eq('id', sessionId)
			.eq('user_id', session.user.id)
			.select('id')
			.maybeSingle();

		if (error) {
			console.error('Error updating session context:', error);
			return fail(500, { error: 'Failed to update session context' });
		}

		if (!updatedSession) {
			return fail(403, { error: 'Session not found or access denied' });
		}

		return { success: true, sessionId };
	},

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

		const { data: sessionData } = await supabase
			.from('sessions')
			.select('user_id')
			.eq('id', sessionId)
			.single();

		if (!sessionData || sessionData.user_id !== session.user.id) {
			return fail(403, { error: 'Unauthorized' });
		}

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

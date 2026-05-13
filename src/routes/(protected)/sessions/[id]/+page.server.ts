/**
 * Server Actions for Session Detail Pages
 * 
 * Note: These actions are available to all child routes (/, /analysis, /detail)
 * because they're defined at the parent route level.
 */

import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    /**
     * Update run tags
     * Allows users to categorize runs (warmup, best-effort, etc.)
     */
    updateRunTags: async ({ request, locals: { supabase } }) => {
        const data = await request.formData();
        const runId = data.get('runId') as string;
        const sessionId = data.get('sessionId') as string;
        const tagsJson = data.get('tags') as string;
        
        if (!runId || !sessionId) {
            return fail(400, { error: 'Missing runId or sessionId' });
        }
        
        let tags: string[] = [];
        try {
            tags = JSON.parse(tagsJson);
        } catch (e) {
            return fail(400, { error: 'Invalid tags format' });
        }
        
        // Update run tags
        const { error } = await supabase
            .from('runs')
            .update({ tags })
            .eq('id', runId)
            .eq('session_id', sessionId); // Security: Verify session ownership
        
        if (error) {
            console.error('Error updating run tags:', error);
            return fail(500, { error: 'Failed to update run tags' });
        }
        
        return { success: true, runId, tags };
    },

    /**
     * Update session context (weather, surface, focus)
     */
    updateSessionContext: async ({ request, locals: { supabase, getSession } }) => {
        const session = await getSession();
        if (!session) {
            return fail(401, { error: 'Not authenticated' });
        }

        const data = await request.formData();
        const sessionId = data.get('sessionId') as string;
        const weather = data.get('weather') as string | null;
        const surface = data.get('surface') as string | null;
        const focus = data.get('focus') as string | null;
        
        if (!sessionId) {
            return fail(400, { error: 'Missing sessionId' });
        }
        
        // Update session context (TypeScript errors will resolve after migration + type regeneration)
        const { error } = await supabase
            .from('sessions')
            .update({
                weather_conditions: weather || null,
                track_surface: surface || null,
                session_focus: focus || null,
            } as any) // Use 'as any' until database types are regenerated
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

        // Insert note (use 'as any' until database types are regenerated after migration)
        const { error } = await (supabase as any)
            .from('session_notes')
            .insert({
                session_id: sessionId,
                user_id: session.user.id,
                note_type: noteType,
                content,
                author_role: authorRole || null,
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

        // Update note (RLS will ensure ownership) - use 'as any' until types regenerated
        const { error } = await (supabase as any)
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

        // Delete note (RLS will ensure ownership) - use 'as any' until types regenerated
        const { error } = await (supabase as any)
            .from('session_notes')
            .delete()
            .eq('id', noteId)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Error deleting note:', error);
            return fail(500, { error: 'Failed to delete note' });
        }

        return { success: true };
    },
};

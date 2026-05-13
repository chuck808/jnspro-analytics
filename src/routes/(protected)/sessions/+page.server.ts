import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import type { SessionListItem } from '$lib/types/queries';

export const load: PageServerLoad = async ({ locals: { supabase }, parent, url }) => {
    const { profile } = await parent();
    if (!profile) return { sessions: [], totalCount: 0, page: 1, perPage: 10, dateFrom: null, dateTo: null };

    // Get pagination and filter params
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const perPage = parseInt(url.searchParams.get('perPage') ?? '10');
    const dateFrom = url.searchParams.get('dateFrom') || null;
    const dateTo = url.searchParams.get('dateTo') || null;
    const sortBy = url.searchParams.get('sortBy') || 'timestamp';
    const sortDir = (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    // Build query
    let query = supabase
        .from('sessions')
        .select(`
            id,
            session_type,
            timestamp,
            notes,
            archived,
            bikes(name),
            runs(
                id,
                elapsed_time_ms,
                distance_m,
                gate_runs(
                    reaction_time_ms,
                    max_g,
                    peak_speed_ms,
                    analytics_valid
                )
            )
        `, { count: 'exact' })
        .eq('user_id', profile.id)
        .eq('archived', false);

    // Apply date filters
    if (dateFrom) {
        query = query.gte('timestamp', dateFrom);
    }
    if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('timestamp', endDate.toISOString());
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: sessions, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Sessions load error:', error);
        return { sessions: [], totalCount: 0, page, perPage, dateFrom, dateTo };
    }

    // Compute summary stats per session  
    type SessionRun = { gate_runs: Array<{ reaction_time_ms: number; max_g: number; peak_speed_ms: number | null; analytics_valid: boolean }> | null };
    type SessionWithRuns = { id: string; session_type: string; timestamp: string; notes: string | null; bikes: { name: string } | null; runs: SessionRun[] };
    
    let sessionsWithStats = (sessions as SessionWithRuns[] ?? []).map((session) => {
        const runs = session.runs ?? [];
        const gateRuns = runs
            .map((r) => r.gate_runs)
            .flat()
            .filter(Boolean);

        const runCount = runs.length;
        const bestReaction = gateRuns.length > 0
            ? Math.min(...gateRuns.map(g => g!.reaction_time_ms))
            : null;
        const bestPeakSpeed = gateRuns.length > 0
            ? Math.max(...gateRuns.filter(g => g!.analytics_valid).map(g => g!.peak_speed_ms ?? 0))
            : null;
        const bestMaxG = gateRuns.length > 0
            ? Math.max(...gateRuns.map(g => g!.max_g))
            : null;

        return {
            id:            session.id,
            session_type:  session.session_type,
            timestamp:     session.timestamp,
            notes:         session.notes,
            bike_name:     session.bikes?.name ?? null,
            run_count:     runCount,
            best_reaction_ms:   bestReaction,
            best_peak_speed_ms: bestPeakSpeed && bestPeakSpeed > 0 ? bestPeakSpeed : null,
            best_max_g:    bestMaxG,
            has_valid_speed: gateRuns.some(g => g!.analytics_valid),
        };
    });

    // Client-side sorting (since we computed stats after query)
    if (sortBy && sessionsWithStats.length > 0) {
        sessionsWithStats.sort((a, b) => {
            let aVal: number = 0;
            let bVal: number = 0;
            
            switch (sortBy) {
                case 'timestamp':
                    aVal = new Date(a.timestamp).getTime();
                    bVal = new Date(b.timestamp).getTime();
                    break;
                case 'run_count':
                    aVal = a.run_count;
                    bVal = b.run_count;
                    break;
                case 'best_reaction_ms':
                    aVal = a.best_reaction_ms ?? Infinity;
                    bVal = b.best_reaction_ms ?? Infinity;
                    break;
                case 'best_peak_speed_ms':
                    aVal = a.best_peak_speed_ms ?? -Infinity;
                    bVal = b.best_peak_speed_ms ?? -Infinity;
                    break;
                case 'best_max_g':
                    aVal = a.best_max_g ?? -Infinity;
                    bVal = b.best_max_g ?? -Infinity;
                    break;
                default:
                    aVal = new Date(a.timestamp).getTime();
                    bVal = new Date(b.timestamp).getTime();
            }
            
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return sortDir === 'asc' ? comparison : -comparison;
        });
    }

    return { 
        sessions: sessionsWithStats, 
        totalCount: count ?? 0, 
        page, 
        perPage,
        dateFrom,
        dateTo,
        sortBy,
        sortDir
    };
};

export const actions: Actions = {
    deleteSession: async ({ request, locals: { supabase, user } }) => {
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const sessionId = formData.get('sessionId') as string;

        if (!sessionId) {
            return fail(400, { message: 'Session ID required' });
        }

        // Verify session belongs to user before deleting
        const { data: session } = await supabase
            .from('sessions')
            .select('id')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single();

        if (!session) {
            return fail(404, { message: 'Session not found or access denied' });
        }

        // Hard delete to trigger cascade deletion of related data (runs, gate_runs, timeseries, etc.)
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            console.error('Delete session error:', error);
            return fail(500, { message: 'Failed to delete session' });
        }

        return { success: true };
    }
};

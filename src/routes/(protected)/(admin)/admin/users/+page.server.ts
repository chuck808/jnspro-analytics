import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
    const admin = createSupabaseAdminClient();

    const [usersResult, sessionsResult] = await Promise.all([
        admin.from('profiles')
            .select('id, name, email, role, created_at, club, country, display_name')
            .order('created_at', { ascending: false }),
        admin.from('sessions')
            .select('id, user_id, session_type, timestamp, archived'),
    ]);

    const users    = usersResult.data    ?? [];
    const sessions = sessionsResult.data ?? [];

    const sessionsByUser = sessions.reduce<Record<string, number>>((acc, s) => {
        acc[s.user_id] = (acc[s.user_id] ?? 0) + 1;
        return acc;
    }, {});

    const lastSessionByUser = sessions.reduce<Record<string, string>>((acc, s) => {
        if (!acc[s.user_id] || s.timestamp > acc[s.user_id]) acc[s.user_id] = s.timestamp;
        return acc;
    }, {});

    return {
        users: users.map(u => ({
            ...u,
            session_count: sessionsByUser[u.id] ?? 0,
            last_session:  lastSessionByUser[u.id] ?? null,
        }))
    };
};

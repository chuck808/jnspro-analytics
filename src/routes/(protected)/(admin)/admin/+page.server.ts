import type { PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
    // Use admin client to bypass RLS for system-wide stats
    const admin = createSupabaseAdminClient();

    const [usersResult, sessionsResult, auditResult, profilesResult] = await Promise.all([
        admin.from('profiles').select('id, name, email, role, created_at'),
        admin.from('sessions').select('id, user_id, session_type, timestamp, archived'),
        admin.from('admin_role_audit')
            .select('id, actor_id, target_id, old_role, new_role, changed_at, reason')
            .order('changed_at', { ascending: false })
            .limit(10),
        admin.from('profiles').select('id, created_at').order('created_at', { ascending: false }),
    ]);

    const users    = usersResult.data    ?? [];
    const sessions = sessionsResult.data ?? [];
    const audit    = auditResult.data    ?? [];
    const profiles = profilesResult.data ?? [];

    // Per-user session counts
    const sessionsByUser = sessions.reduce<Record<string, number>>((acc, s) => {
        acc[s.user_id] = (acc[s.user_id] ?? 0) + 1;
        return acc;
    }, {});

    // Most recent session per user
    const lastSessionByUser = sessions.reduce<Record<string, string>>((acc, s) => {
        if (!acc[s.user_id] || s.timestamp > acc[s.user_id]) {
            acc[s.user_id] = s.timestamp;
        }
        return acc;
    }, {});

    const enrichedUsers = users.map(u => ({
        ...u,
        session_count: sessionsByUser[u.id] ?? 0,
        last_session:  lastSessionByUser[u.id] ?? null,
    }));

    // Calculate growth stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const newUsersLast30Days = profiles.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length;
    const newUsersLast7Days = profiles.filter(p => new Date(p.created_at) >= sevenDaysAgo).length;
    
    const sessionsLast30Days = sessions.filter(s => new Date(s.timestamp) >= thirtyDaysAgo).length;
    const sessionsLast7Days = sessions.filter(s => new Date(s.timestamp) >= sevenDaysAgo).length;

    // Active users (users with sessions in last 30 days)
    const activeUserIds = new Set(
        sessions
            .filter(s => new Date(s.timestamp) >= thirtyDaysAgo)
            .map(s => s.user_id)
    );
    const activeUsers = activeUserIds.size;

    // Users with no sessions
    const usersWithNoSessions = users.filter(u => !sessionsByUser[u.id]).length;

    // Average sessions per user (excluding zero)
    const usersWithSessions = users.filter(u => sessionsByUser[u.id] > 0);
    const avgSessionsPerUser = usersWithSessions.length > 0
        ? sessions.length / usersWithSessions.length
        : 0;

    // Most active users
    const topUsers = enrichedUsers
        .filter(u => u.session_count > 0)
        .sort((a, b) => b.session_count - a.session_count)
        .slice(0, 5);

    // Recent signups
    const recentSignups = enrichedUsers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    return {
        users: enrichedUsers,
        totalUsers: users.length,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => !s.archived).length,
        adminCount: users.filter(u => u.role === 'admin').length,
        recentAudit: audit,
        
        // Growth stats
        newUsersLast30Days,
        newUsersLast7Days,
        sessionsLast30Days,
        sessionsLast7Days,
        activeUsers,
        usersWithNoSessions,
        avgSessionsPerUser,
        
        // Top performers
        topUsers,
        recentSignups,
    };
};

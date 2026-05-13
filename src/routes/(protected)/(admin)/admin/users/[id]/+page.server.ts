import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSupabaseAdminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
    const admin = createSupabaseAdminClient();

    const [profileResult, sessionsResult, riderResult, bikeResult, auditResult] = await Promise.all([
        admin.from('profiles')
            .select('*')
            .eq('id', params.id)
            .single(),
        admin.from('sessions')
            .select('id, session_type, timestamp, archived, runs(id)')
            .eq('user_id', params.id)
            .order('timestamp', { ascending: false }),
        admin.from('rider_profiles')
            .select('*')
            .eq('user_id', params.id)
            .order('effective_from', { ascending: false })
            .limit(1)
            .maybeSingle(),
        admin.from('bikes')
            .select('*')
            .eq('user_id', params.id)
            .eq('is_active', true)
            .maybeSingle(),
        admin.from('admin_role_audit')
            .select('*')
            .eq('target_id', params.id)
            .order('changed_at', { ascending: false }),
    ]);

    return {
        profile:    profileResult.data,
        sessions:   sessionsResult.data ?? [],
        rider:      riderResult.data,
        bike:       bikeResult.data,
        auditLog:   auditResult.data ?? [],
    };
};

export const actions: Actions = {
    setRole: async ({ request, locals, params }) => {
        const form    = await request.formData();
        const newRole = form.get('role') as string;
        const reason  = form.get('reason') as string || undefined;

        if (!['admin', 'user'].includes(newRole)) {
            return fail(400, { roleError: 'Invalid role' });
        }

        const { error } = await locals.supabase.rpc('set_user_role', {
            p_target_id: params.id,
            p_new_role:  newRole,
            p_reason:    reason,
        });

        if (error) return fail(500, { roleError: error.message });
        return { roleSuccess: true };
    }
};

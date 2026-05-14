import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { Database } from '$lib/types/database.types';
import type { Cookies } from '@sveltejs/kit';

// Standard server client — respects RLS, uses session cookie
export function createSupabaseServerClient(cookies: Cookies) {
    return createServerClient<Database>(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookies.set(name, value, { 
                            ...options, 
                            path: '/',
                            httpOnly: true,
                            secure: true,
                            sameSite: 'none'
                        });
                    });
                }
            }
        }
    );
}

// Admin client — bypasses RLS, server-side only
// Only use in +page.server.ts, +server.ts, hooks.server.ts
export function createSupabaseAdminClient() {
    return createServerClient<Database>(
        PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            cookies: { getAll: () => [], setAll: () => {} },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

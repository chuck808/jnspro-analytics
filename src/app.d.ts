import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

declare global {
    namespace App {
        interface Locals {
            supabase:       SupabaseClient<Database>;
            safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
            getSession:     () => Promise<Session | null>;
            session:        Session | null;
            user:           User | null;
        }
        // interface Error {}
        // interface PageData {}
        // interface Platform {}
    }
}

export {};

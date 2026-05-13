/**
 * src/lib/server/env.ts
 *
 * Environment variable validation — called once at startup from hooks.server.ts.
 * Uses SvelteKit's $env/static/public rather than process.env.
 */

import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
} from '$env/static/public';

let validated = false;

export function validateEnv(): void {
    if (validated) return;
    validated = true;

    const errors: string[] = [];

    // PUBLIC_SUPABASE_URL
    if (!PUBLIC_SUPABASE_URL || PUBLIC_SUPABASE_URL.trim() === '') {
        errors.push(
            'Missing: PUBLIC_SUPABASE_URL\n' +
            '  Add your Supabase project URL to .env.local'
        );
    } else {
        try {
            const url = new URL(PUBLIC_SUPABASE_URL);
            if (!url.hostname.includes('supabase')) {
                errors.push(
                    `PUBLIC_SUPABASE_URL does not look like a Supabase URL: ${PUBLIC_SUPABASE_URL}`
                );
            }
        } catch {
            errors.push(`PUBLIC_SUPABASE_URL is not a valid URL: ${PUBLIC_SUPABASE_URL}`);
        }
    }

    // PUBLIC_SUPABASE_ANON_KEY
    // Supabase supports both legacy JWT keys (eyJ...) and newer sb_publishable_ keys
    if (!PUBLIC_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_ANON_KEY.trim() === '') {
        errors.push(
            'Missing: PUBLIC_SUPABASE_ANON_KEY\n' +
            '  Add your Supabase anonymous key to .env.local'
        );
    } else if (
        !PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ') &&
        !PUBLIC_SUPABASE_ANON_KEY.startsWith('sb_publishable_')
    ) {
        errors.push(
            'PUBLIC_SUPABASE_ANON_KEY does not look like a valid Supabase key\n' +
            '  Expected a key starting with eyJ... or sb_publishable_...'
        );
    }

    if (errors.length > 0) {
        const message = [
            '',
            '╔══════════════════════════════════════════════════════╗',
            '║  AppGatePro — Environment Configuration Error        ║',
            '╚══════════════════════════════════════════════════════╝',
            '',
            ...errors.map(e => `  ${e}`),
            '',
            'The server cannot start until these are resolved.',
            '',
        ].join('\n');

        console.error(message);
        throw new Error('Environment validation failed — see above for details');
    }

    console.info('✓ AppGatePro environment validated');
}

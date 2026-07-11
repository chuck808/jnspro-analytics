/**
 * src/lib/server/env.ts
 *
 * Environment variable validation — called once at startup from hooks.server.ts.
 * Uses SvelteKit's $env/static/public and $env/static/private.
 */

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

import { SUPABASE_SERVICE_ROLE_KEY, DEVICE_INGEST_SECRET } from '$env/static/private';

let validated = false;

export function validateEnv(): void {
	if (validated) return;
	validated = true;

	const errors: string[] = [];

	// PUBLIC_SUPABASE_URL
	if (!PUBLIC_SUPABASE_URL || PUBLIC_SUPABASE_URL.trim() === '') {
		errors.push('Missing: PUBLIC_SUPABASE_URL\n' + '  Add your Supabase project URL to .env.local');
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
			'Missing: PUBLIC_SUPABASE_ANON_KEY\n' + '  Add your Supabase anonymous key to .env.local'
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

	// SUPABASE_SERVICE_ROLE_KEY (private — needed for admin operations)
	// Supabase supports both legacy JWT keys (eyJ...) and newer sb_secret_ keys
	if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.trim() === '') {
		errors.push(
			'Missing: SUPABASE_SERVICE_ROLE_KEY\n' +
				'  Add your Supabase service role key to .env.local\n' +
				'  Required for: admin Supabase client operations'
		);
	} else if (
		!SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ') &&
		!SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')
	) {
		errors.push(
			'SUPABASE_SERVICE_ROLE_KEY does not look like a valid Supabase service role key\n' +
				'  Expected a key starting with eyJ... or sb_secret_...'
		);
	}

	// DEVICE_INGEST_SECRET (private — needed for device data ingestion)
	if (!DEVICE_INGEST_SECRET || DEVICE_INGEST_SECRET.trim() === '') {
		errors.push(
			'Missing: DEVICE_INGEST_SECRET\n' +
				'  Add a secure secret for device ingest endpoint to .env.local\n' +
				'  Required for: /api/device-ingest authentication'
		);
	} else if (DEVICE_INGEST_SECRET.length < 32) {
		errors.push(
			'DEVICE_INGEST_SECRET is too short (must be at least 32 characters)\n' +
				'  Generate a secure random string for production safety'
		);
	}

	if (errors.length > 0) {
		const message = [
			'',
			'╔══════════════════════════════════════════════════════╗',
			'║  AppGatePro — Environment Configuration Error        ║',
			'╚══════════════════════════════════════════════════════╝',
			'',
			...errors.map((e) => `  ${e}`),
			'',
			'The server cannot start until these are resolved.',
			''
		].join('\n');

		console.error(message);
		throw new Error('Environment validation failed — see above for details');
	}

	console.info('✓ AppGatePro environment validated');
}

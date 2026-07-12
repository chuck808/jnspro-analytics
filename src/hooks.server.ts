/**
 * hooks.server.ts
 *
 * SvelteKit server hooks for AppGatePro analytics platform.
 *
 * Responsibilities:
 *   1. Supabase session handling (safeGetSession / getSession)
 *   2. Security headers on every response
 *   3. Basic upload rate limiting (in-memory, resets on server restart)
 *   4. Auth guard — redirects unauthenticated requests away from protected routes
 *   5. Error tracking (Sentry, when PUBLIC_SENTRY_DSN is configured)
 */

import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect, error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { env as publicEnv } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';
import { validateEnv } from '$lib/server/env';
import { createSupabaseAdminClient } from '$lib/server/supabase';

// Validate environment on startup
validateEnv();

// Sentry is optional: with no DSN configured it's a safe no-op (SDK just
// doesn't send anything). Set PUBLIC_SENTRY_DSN in .env.local / Vercel once
// you have a Sentry project to turn this on.
Sentry.init({
	dsn: publicEnv.PUBLIC_SENTRY_DSN || undefined,
	tracesSampleRate: 0.1
});

// ─── Types ────────────────────────────────────────────────────────────────────

import type { Session, User } from '@supabase/supabase-js';

// ─── Security headers ─────────────────────────────────────────────────────────

/**
 * Applied to every response.
 * CSP is report-only during development — tighten to enforce in production
 * once you've confirmed no violations.
 */
// ─── Analytics event writer ──────────────────────────────────────────────────
//
// Writes page_view_events and error_events to Supabase on every request.
// Uses the admin client (service role) so no RLS policy is needed on those
// tables for writes. Fire-and-forget with void — analytics failures must never
// affect the user-facing response.
//
// Route normalisation: replaces UUIDs and numeric IDs in pathnames with their
// SvelteKit parameter placeholders so the admin page groups by route pattern
// rather than one row per session/user ID.
//   /sessions/abc-123-def  →  /sessions/[id]
//   /admin/users/456        →  /admin/users/[id]

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_RE = /\/\d+(\/|$)/g;

function normaliseRoute(pathname: string): string {
	return pathname.replace(UUID_RE, '[id]').replace(NUMERIC_RE, (m) => m.replace(/\d+/, '[id]'));
}

async function trackPageView(
	route: string,
	userId: string | null | undefined,
	durationMs: number | null
): Promise<void> {
	const admin = createSupabaseAdminClient();
	void admin.from('page_view_events').insert({
		route,
		user_id: userId ?? null,
		duration_ms: durationMs
	});
}

async function trackError(
	route: string,
	statusCode: number,
	message: string,
	detail: string | null,
	userId: string | null | undefined
): Promise<void> {
	const severity =
		statusCode >= 500
			? 'error'
			: statusCode === 429
				? 'warning'
				: statusCode >= 400
					? 'info'
					: 'info';

	const admin = createSupabaseAdminClient();
	void admin.from('error_events').insert({
		route,
		status_code: statusCode,
		severity,
		message,
		detail: detail ?? null,
		user_id: userId ?? null
	});
}

const securityHeaders: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const route = normaliseRoute(event.url.pathname);
	const userId = event.locals.user?.id;

	// Resolve the response, catching SvelteKit errors so we can log them
	// before re-throwing.
	let response: Response;
	try {
		response = await resolve(event);
	} catch (err: unknown) {
		const status = (err as { status?: number })?.status ?? 500;
		const body = (err as { body?: { message?: string } })?.body;
		const msg = body?.message ?? (err instanceof Error ? err.message : 'Unknown error');
		void trackError(route, status, msg, null, userId);
		throw err;
	}

	const durationMs = Date.now() - start;

	// Track the page view. Skip API routes and static assets — those are
	// high-volume and not useful for the admin analytics overview.
	if (
		!building &&
		!route.startsWith('/api/') &&
		!route.startsWith('/_app/') &&
		!route.startsWith('/favicon') &&
		response.status < 400
	) {
		void trackPageView(route, userId, durationMs);
	}

	// Log non-2xx/3xx responses that weren't thrown as SvelteKit errors.
	if (!building && response.status >= 400) {
		void trackError(route, response.status, `HTTP ${response.status}`, null, userId);
	}

	// Prevent clickjacking
	response.headers.set('X-Frame-Options', 'DENY');

	// Stop MIME-type sniffing
	response.headers.set('X-Content-Type-Options', 'nosniff');

	// Control referrer information sent to third parties
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	// Disable browser features not needed by this app
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), payment=()'
	);

	// HSTS — only sent over HTTPS so safe to include unconditionally
	// max-age = 1 year; includeSubDomains covers any subdomains you may add
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	// Content Security Policy
	// Supabase calls go to your project URL; Chart.js is loaded dynamically
	// from npm so it's bundled — no CDN needed in CSP.
	// Sentry ingest hosts are always allow-listed so CSP doesn't silently
	// swallow error reports the moment a real PUBLIC_SENTRY_DSN is set.
	const supabaseHost = new URL(PUBLIC_SUPABASE_URL).hostname;

	response.headers.set(
		'Content-Security-Policy',
		[
			`default-src 'self'`,
			`script-src 'self' 'unsafe-inline'`, // unsafe-inline needed for Svelte's inline scripts
			`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, // unsafe-inline needed for Tailwind/Svelte styles
			`img-src 'self' data: blob:`, // data: for Chart.js canvas exports, blob: for file previews
			`media-src 'self' blob: https://${supabaseHost}`, // run video attachments served from Supabase Storage signed URLs
			`font-src 'self' https://fonts.gstatic.com`,
			`connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.sentry.io https://*.ingest.sentry.io`,
			`frame-ancestors 'none'`, // belt-and-braces with X-Frame-Options
			`base-uri 'self'`,
			`form-action 'self'`
		].join('; ')
	);

	return response;
};

// ─── Rate limiting ────────────────────────────────────────────────────────────

/**
 * Simple in-memory rate limiter for the upload endpoint.
 * Resets on server restart — sufficient for beta with known users.
 * Replace with Redis/Upstash if you need persistence across deploys.
 *
 * Vercel serverless caveat: each cold start is a fresh process with an empty Map.
 * On Vercel's edge/serverless runtime, multiple concurrent instances can run in
 * parallel and each maintains its own Map independently. This means the effective
 * limit is per-process-instance, not per-user globally. A determined actor could
 * bypass the limit by triggering enough cold starts or hitting different instances.
 * At current scale (invite-only beta, known users) this is acceptable. If abuse
 * becomes a concern, replace uploadLimits/authLimits with Upstash Redis:
 *   https://docs.upstash.com/redis — the @upstash/ratelimit package drops in cleanly.
 *
 * Limits:
 *   - Upload endpoint: max 20 requests per user per hour
 *   - Auth endpoints: max 10 requests per IP per 15 minutes (brute-force guard)
 *   - Feedback endpoints: max 30 requests per user (or IP, if anonymous) per hour
 */

interface RateLimitEntry {
	count: number;
	windowEnd: number; // Unix ms
}

const uploadLimits = new Map<string, RateLimitEntry>();
const authLimits = new Map<string, RateLimitEntry>();
const feedbackLimits = new Map<string, RateLimitEntry>();

function checkRateLimit(
	map: Map<string, RateLimitEntry>,
	key: string,
	maxCount: number,
	windowMs: number
): boolean {
	const now = Date.now();
	const entry = map.get(key);

	if (!entry || now > entry.windowEnd) {
		map.set(key, { count: 1, windowEnd: now + windowMs });
		return true; // allowed
	}

	if (entry.count >= maxCount) return false; // blocked

	entry.count++;
	return true; // allowed
}

// Periodically clean up expired entries to prevent unbounded memory growth
setInterval(
	() => {
		const now = Date.now();
		for (const [key, entry] of uploadLimits) {
			if (now > entry.windowEnd) uploadLimits.delete(key);
		}
		for (const [key, entry] of authLimits) {
			if (now > entry.windowEnd) authLimits.delete(key);
		}
		for (const [key, entry] of feedbackLimits) {
			if (now > entry.windowEnd) feedbackLimits.delete(key);
		}
	},
	5 * 60 * 1000
); // every 5 minutes

const rateLimiter: Handle = async ({ event, resolve }) => {
	// Skip rate limiting during prerendering/build phase
	// getClientAddress() is not available during prerendering
	if (building) {
		return resolve(event);
	}

	const { pathname } = event.url;

	// Upload rate limit — keyed by user ID (set after Supabase handle runs)
	if (pathname === '/api/upload' || pathname.startsWith('/api/upload')) {
		const userId = event.locals.user?.id ?? event.getClientAddress();
		const allowed = checkRateLimit(
			uploadLimits,
			userId,
			20, // max 20 uploads
			60 * 60_000 // per hour
		);
		if (!allowed) {
			throw error(429, 'Too many upload requests — please wait before trying again');
		}
	}

	// Auth rate limit — keyed by IP to guard against brute force
	if (pathname.startsWith('/auth')) {
		const ip = event.getClientAddress();
		const allowed = checkRateLimit(
			authLimits,
			ip,
			10, // max 10 auth attempts
			15 * 60_000 // per 15 minutes
		);
		if (!allowed) {
			throw error(429, 'Too many authentication attempts — please wait 15 minutes');
		}
	}

	// Feedback rate limit — keyed by user ID when authenticated, IP otherwise
	// (feedback submission is intentionally allowed anonymously).
	if (pathname.startsWith('/api/feedback')) {
		const key = event.locals.user?.id ?? event.getClientAddress();
		const allowed = checkRateLimit(
			feedbackLimits,
			key,
			30, // max 30 feedback requests
			60 * 60_000 // per hour
		);
		if (!allowed) {
			throw error(429, 'Too many feedback requests — please wait before trying again');
		}
	}

	return resolve(event);
};

// ─── Supabase session handling ────────────────────────────────────────────────

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/',
						httpOnly: true,
						secure: true,
						sameSite: 'none'
					});
				});
			}
		}
	});

	/**
	 * safeGetSession — validates the session JWT server-side.
	 * Use this everywhere you need to trust the session.
	 * The raw getSession() result is NOT validated and should not be trusted alone.
	 */
	event.locals.safeGetSession = async (): Promise<{
		session: Session | null;
		user: User | null;
	}> => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error: userError
		} = await event.locals.supabase.auth.getUser();
		if (userError) return { session: null, user: null };

		return { session, user };
	};

	/**
	 * getSession — convenience wrapper, returns just the session.
	 * Only use where you've already validated via safeGetSession upstream,
	 * or where you don't need server-trust (e.g. layout data for display only).
	 */
	event.locals.getSession = async (): Promise<Session | null> => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

// ─── Auth guard ───────────────────────────────────────────────────────────────

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();

	event.locals.session = session;
	event.locals.user = user;

	const { pathname } = event.url;

	const isProtected =
		pathname.startsWith('/sessions') ||
		pathname.startsWith('/dashboard') ||
		pathname.startsWith('/analytics') ||
		pathname.startsWith('/goals') ||
		pathname.startsWith('/profile') ||
		pathname.startsWith('/admin') ||
		pathname.startsWith('/upload') ||
		pathname.startsWith('/settings') ||
		pathname.startsWith('/leaderboard') ||
		pathname.startsWith('/help');

	if (isProtected && !session) {
		throw redirect(303, '/auth/sign-in');
	}

	if (session && (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up'))) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};

// ─── Compose and export ───────────────────────────────────────────────────────

export const handle = sequence(
	Sentry.sentryHandle(), // 0. instrument the whole request (no-op without a DSN)
	supabaseHandle, // 1. establish Supabase client + session helpers
	authGuard, // 2. validate session, set locals, redirect if needed
	rateLimiter, // 3. rate limit (after authGuard so user ID is available)
	securityHeaders // 4. apply security headers to every response
);

export const handleError = Sentry.handleErrorWithSentry();

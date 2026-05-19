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
 */

import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect, error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
} from '$env/static/public';
import { validateEnv } from '$lib/server/env';

// Validate environment on startup
validateEnv();

// ─── Types ────────────────────────────────────────────────────────────────────

import type { Session, User } from '@supabase/supabase-js';

// ─── Security headers ─────────────────────────────────────────────────────────

/**
 * Applied to every response.
 * CSP is report-only during development — tighten to enforce in production
 * once you've confirmed no violations.
 */
const securityHeaders: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);

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
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
    );

    // Content Security Policy
    // Supabase calls go to your project URL; Chart.js is loaded dynamically
    // from npm so it's bundled — no CDN needed in CSP.
    // Adjust 'connect-src' if you add external API calls (e.g. Sentry).
    const supabaseHost = new URL(PUBLIC_SUPABASE_URL).hostname;

    response.headers.set(
        'Content-Security-Policy',
        [
            `default-src 'self'`,
            `script-src 'self' 'unsafe-inline'`,          // unsafe-inline needed for Svelte's inline scripts
            `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,            // unsafe-inline needed for Tailwind/Svelte styles
            `img-src 'self' data: blob:`,                  // data: for Chart.js canvas exports, blob: for file previews
            `font-src 'self' https://fonts.gstatic.com`,
            `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
            `frame-ancestors 'none'`,                      // belt-and-braces with X-Frame-Options
            `base-uri 'self'`,
            `form-action 'self'`,
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
 * Limits:
 *   - Upload endpoint: max 20 requests per user per hour
 *   - Auth endpoints: max 10 requests per IP per 15 minutes (brute-force guard)
 */

interface RateLimitEntry {
    count:     number;
    windowEnd: number; // Unix ms
}

const uploadLimits = new Map<string, RateLimitEntry>();
const authLimits   = new Map<string, RateLimitEntry>();

function checkRateLimit(
    map:        Map<string, RateLimitEntry>,
    key:        string,
    maxCount:   number,
    windowMs:   number
): boolean {
    const now   = Date.now();
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
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of uploadLimits) {
        if (now > entry.windowEnd) uploadLimits.delete(key);
    }
    for (const [key, entry] of authLimits) {
        if (now > entry.windowEnd) authLimits.delete(key);
    }
}, 5 * 60 * 1000); // every 5 minutes

const rateLimiter: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;

    // Upload rate limit — keyed by user ID (set after Supabase handle runs)
    if (pathname === '/api/upload' || pathname.startsWith('/api/upload')) {
        const userId = event.locals.user?.id ?? event.getClientAddress();
        const allowed = checkRateLimit(
            uploadLimits,
            userId,
            20,           // max 20 uploads
            60 * 60_000   // per hour
        );
        if (!allowed) {
            throw error(429, 'Too many upload requests — please wait before trying again');
        }
    }

    // Auth rate limit — keyed by IP to guard against brute force
    if (pathname.startsWith('/auth')) {
        const ip      = event.getClientAddress();
        const allowed = checkRateLimit(
            authLimits,
            ip,
            10,            // max 10 auth attempts
            15 * 60_000    // per 15 minutes
        );
        if (!allowed) {
            throw error(429, 'Too many authentication attempts — please wait 15 minutes');
        }
    }

    return resolve(event);
};

// ─── Supabase session handling ────────────────────────────────────────────────

const supabaseHandle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY,
        {
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
                },
            },
        }
    );

    /**
     * safeGetSession — validates the session JWT server-side.
     * Use this everywhere you need to trust the session.
     * The raw getSession() result is NOT validated and should not be trusted alone.
     */
    event.locals.safeGetSession = async (): Promise<{ session: Session | null; user: User | null }> => {
        const { data: { session } } = await event.locals.supabase.auth.getSession();
        if (!session) return { session: null, user: null };

        const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser();
        if (userError) return { session: null, user: null };

        return { session, user };
    };

    /**
     * getSession — convenience wrapper, returns just the session.
     * Only use where you've already validated via safeGetSession upstream,
     * or where you don't need server-trust (e.g. layout data for display only).
     */
    event.locals.getSession = async (): Promise<Session | null> => {
        const { data: { session } } = await event.locals.supabase.auth.getSession();
        return session;
    };

    return resolve(event, {
        filterSerializedResponseHeaders: (name) =>
            name === 'content-range' || name === 'x-supabase-api-version',
    });
};

// ─── Auth guard ───────────────────────────────────────────────────────────────

const authGuard: Handle = async ({ event, resolve }) => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    const user = session?.user ?? null;

    event.locals.session = session;
    event.locals.user = user;

    const { pathname } = event.url;
    const isProtected = pathname.startsWith('/sessions') ||
                        pathname.startsWith('/dashboard')   || pathname.startsWith('/analytics') ||
                        pathname.startsWith('/goals')       || pathname.startsWith('/profile')   ||
                        pathname.startsWith('/admin')       || pathname.startsWith('/upload');

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
    supabaseHandle,   // 1. establish Supabase client + session helpers
    authGuard,        // 2. validate session, set locals, redirect if needed
    rateLimiter,      // 3. rate limit (after authGuard so user ID is available)
    securityHeaders,  // 4. apply security headers to every response
);

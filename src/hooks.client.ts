/**
 * hooks.client.ts
 *
 * Client-side error tracking (Sentry, when PUBLIC_SENTRY_DSN is configured).
 * With no DSN set this is a safe no-op — the SDK initializes but never sends.
 */

import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: env.PUBLIC_SENTRY_DSN || undefined,
	tracesSampleRate: 0.1
});

export const handleError = Sentry.handleErrorWithSentry();

# Prerender Fix - SvelteKit Build Error

## Problem Summary

The Vercel build was failing with the error:

```
Error: Cannot read clientAddress during prerendering
at rateLimiter (...hooks.server.js:109:41)
```

## Root Cause

During the SvelteKit build/prerendering phase:

1. SvelteKit attempts to prerender routes (generate static HTML)
2. The `/dashboard` route redirects to `/auth/sign-in`
3. The `rateLimiter` hook runs and tries to call `event.getClientAddress()` on line 155
4. **During prerendering, there is no real client request**, so `getClientAddress()` throws an error
5. Build fails

## Solution

Added a guard at the beginning of the `rateLimiter` function to skip rate limiting during the build/prerender phase:

```typescript
import { building } from '$app/environment';

const rateLimiter: Handle = async ({ event, resolve }) => {
	// Skip rate limiting during prerendering/build phase
	// getClientAddress() is not available during prerendering
	if (building) {
		return resolve(event);
	}

	// ... rest of rate limiter logic
};
```

## Why This Works

- `building` is a SvelteKit environment variable that is `true` during prerendering/build and `false` at runtime
- By checking this flag early, we bypass all rate limiting logic (including `getClientAddress()` calls) during the build
- At runtime, rate limiting works normally since `building` will be `false`

## Additional Safeguards

The auth routes already have prerendering disabled via `/src/routes/auth/+page.ts`:

```typescript
export const prerender = false;
```

This is correct since auth pages are dynamic and shouldn't be statically prerendered anyway.

## Testing

To verify the fix:

1. Deploy to Vercel (or run `pnpm build` locally)
2. The build should now complete successfully
3. Rate limiting will still work normally for actual user requests at runtime

## Impact

- ✅ Build will no longer fail during prerendering
- ✅ Rate limiting still functions normally at runtime
- ✅ No security impact (rate limiting wasn't active during prerendering anyway)
- ✅ Auth pages remain dynamic (not prerendered)

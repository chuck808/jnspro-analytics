/**
 * src/lib/server/consent.ts
 *
 * Server-only parental consent helpers. Pure age/threshold logic lives in
 * $lib/consent.ts (shared with the client, e.g. the signup form) — this
 * file re-exports that plus the token generator, which stays server-side
 * since it's only ever called from +page.server.ts actions.
 */

export {
	MINOR_CONSENT_AGE_THRESHOLD,
	calculateAge,
	requiresParentalConsent,
	isValidPastDate
} from '$lib/consent';

/** Cryptographically random 64-char hex token for the consent confirmation link. */
export function generateConsentToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

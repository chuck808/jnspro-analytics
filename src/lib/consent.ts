/**
 * src/lib/consent.ts
 *
 * Pure age/consent-threshold helpers, safe to import from both client and
 * server code (e.g. the signup form needs to know whether to show the
 * parent/guardian email field before the user submits).
 *
 * AppGatePro's privacy policy explicitly targets riders who may be under 18
 * — this is the technical mechanism for that, not a legal compliance
 * certification.
 */

/**
 * Age (in years) at/above which a rider is NOT required to have parental
 * consent recorded before using AppGatePro. GDPR lets EU/UK member states
 * set a minor's own-consent threshold anywhere from 13 to 16; COPPA (US)
 * uses 13. 16 covers the strictest common threshold, but this has NOT been
 * reviewed by a lawyer for your specific jurisdictions — do that review
 * before relying on this number for real compliance.
 */
export const MINOR_CONSENT_AGE_THRESHOLD = 16;

export function calculateAge(dateOfBirth: string, asOf: Date = new Date()): number {
	const dob = new Date(dateOfBirth);
	let age = asOf.getFullYear() - dob.getFullYear();
	const monthDiff = asOf.getMonth() - dob.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
		age--;
	}
	return age;
}

export function requiresParentalConsent(dateOfBirth: string): boolean {
	return calculateAge(dateOfBirth) < MINOR_CONSENT_AGE_THRESHOLD;
}

export function isValidPastDate(dateString: string): boolean {
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return false;
	const now = new Date();
	if (date > now) return false;
	const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
	return date >= minDate;
}

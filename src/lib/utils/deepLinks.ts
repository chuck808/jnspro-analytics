/**
 * Deep Link Utilities
 *
 * Helpers for creating URL-based navigation to specific views within the app.
 * Enables cross-page linking with state preservation (e.g., linking to a specific run within a session).
 */

/**
 * Generate a deep link to a specific run within a session
 * @param sessionId - The session UUID
 * @param runNumber - The run number (1-indexed)
 * @returns URL path with query parameters
 *
 * @example
 * ```ts
 * // Link to run 3 of a session
 * const link = getSessionRunLink('abc-123', 3);
 * // Returns: '/sessions/abc-123?run=3'
 * ```
 */
export function getSessionRunLink(sessionId: string, runNumber: number): string {
	return `/sessions/${sessionId}?run=${runNumber}`;
}

/**
 * Generate a deep link to a session (no specific run)
 * @param sessionId - The session UUID
 * @returns URL path
 */
export function getSessionLink(sessionId: string): string {
	return `/sessions/${sessionId}`;
}

/**
 * Parse run number from URL search parameters
 * @param searchParams - URLSearchParams object
 * @returns Run number if present, null otherwise
 *
 * @example
 * ```ts
 * const params = new URLSearchParams(window.location.search);
 * const runNumber = getRunNumberFromParams(params);
 * ```
 */
export function getRunNumberFromParams(searchParams: URLSearchParams): number | null {
	const runParam = searchParams.get('run');
	if (!runParam) return null;

	const runNumber = parseInt(runParam, 10);
	return isNaN(runNumber) ? null : runNumber;
}

/**
 * Update URL with run parameter without navigation
 * @param runNumber - The run number to set in the URL
 *
 * @example
 * ```ts
 * // User selects run 5, update URL without page reload
 * updateUrlRunParameter(5);
 * ```
 */
export function updateUrlRunParameter(runNumber: number): void {
	if (typeof window === 'undefined') return;

	const url = new URL(window.location.href);
	url.searchParams.set('run', String(runNumber));
	window.history.replaceState({}, '', url.toString());
}

/**
 * Remove run parameter from URL without navigation
 */
export function clearUrlRunParameter(): void {
	if (typeof window === 'undefined') return;

	const url = new URL(window.location.href);
	url.searchParams.delete('run');
	window.history.replaceState({}, '', url.toString());
}

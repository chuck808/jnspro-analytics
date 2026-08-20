import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Stable SHA-256 fingerprint for a parsed session upload.
 * Both manual SD and direct device/Wi-Fi ingest must use this helper so
 * transport does not change session identity.
 */
export async function calculateSessionChecksum(data: unknown): Promise<string> {
	const jsonString = JSON.stringify(data);
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(jsonString);
	const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function findSessionByChecksum(
	supabase: SupabaseClient,
	userId: string,
	fileChecksum: string
) {
	return supabase
		.from('sessions')
		.select('id, timestamp, session_type, runs(id)')
		.eq('user_id', userId)
		.eq('file_checksum', fileChecksum)
		.maybeSingle();
}

export function isUniqueViolation(error: { code?: string | null } | null | undefined): boolean {
	return error?.code === '23505';
}

/**
 * Remove an incomplete session after a failed ingest. A failed rollback is
 * surfaced rather than ignored because leaving the checksum row behind would
 * make a later retry look like a successfully imported duplicate.
 */
export async function rollbackIncompleteSession(
	supabase: SupabaseClient,
	sessionId: string
): Promise<void> {
	const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
	if (error) {
		throw new Error(
			`Failed to roll back incomplete session ${sessionId}: ${error.message} (${error.code ?? 'unknown'})`
		);
	}
}

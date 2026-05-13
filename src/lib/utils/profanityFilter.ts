/**
 * Profanity Filter for Display Names
 * Simple implementation - can be extended with more comprehensive word lists
 */

const PROFANITY_PATTERNS = [
	// Common variations and l33t speak
	/f[u*]+ck/i,
	/sh[i1!]+t/i,
	/b[i1!]+tch/i,
	/[a@]ss/i,
	/d[a@]mn/i,
	/hell/i,
	/[a@]sshole/i,
	/b[a@]st[a@]rd/i,
	/c[o0]ck/i,
	/d[i1!]ck/i,
	/p[i1!]ss/i,
	/wh[o0]re/i,
	/sl[u*]t/i,
	/c[u*]nt/i,
	/f[a@]g/i,
	/n[i1!]gg/i,
	/k[i1!]ke/i,
	/sp[i1!]c/i,
	/ch[i1!]nk/i,
	// Add more patterns as needed
];

export function containsProfanity(text: string): boolean {
	if (!text) return false;
	
	// Remove spaces and special characters for checking
	const normalized = text.toLowerCase().replace(/[\s\-_\.]/g, '');
	
	return PROFANITY_PATTERNS.some(pattern => pattern.test(normalized));
}

export function flaggedDisplayNames(names: string[]): string[] {
	return names.filter(name => containsProfanity(name));
}

export function getSafeDisplayName(name: string): string {
	if (containsProfanity(name)) {
		return '***FLAGGED***';
	}
	return name;
}

export interface DisplayNameCheck {
	name: string;
	isFlagged: boolean;
	reason?: string;
}

export function checkDisplayName(name: string): DisplayNameCheck {
	const isFlagged = containsProfanity(name);
	
	return {
		name,
		isFlagged,
		reason: isFlagged ? 'Contains inappropriate content' : undefined
	};
}

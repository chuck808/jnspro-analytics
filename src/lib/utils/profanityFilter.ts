/**
 * Profanity Filter for Display Names
 * Simple implementation - can be extended with more comprehensive word lists
 */

const PROFANITY_PATTERNS = [
	// Serious slurs — match as whole words only
	/\bn[i1!]gg(a|er)\b/i,
	/\bk[i1!]ke\b/i,
	/\bsp[i1!]c\b/i,
	/\bch[i1!]nk\b/i,
	/\bf[a@]gg?[o0]t\b/i,
	/\bc[u*]nt\b/i,
	/\bwh[o0]re\b/i,
	/\bsl[u*]t\b/i,

	// Profanity — whole words only
	/\bf[u*@]ck(er|ing|ed|s)?\b/i,
	/\bsh[i1!]t(ter|ty|s)?\b/i,
	/\bb[i1!]tch(es)?\b/i,
	/\bd[i1!]ck(head|s)?\b/i,
	/\bc[o0]ck(s|head)?\b/i,
	/\bp[i1!]ss(ed|off)?\b/i,
	/\ba[s$]{2}h[o0]le\b/i,
	/\bb[a@]st[a@]rd\b/i
];

export function containsProfanity(text: string): boolean {
	if (!text) return false;

	// Remove spaces and special characters for checking
	const normalized = text.toLowerCase().replace(/[\s\-_.]/g, '');

	return PROFANITY_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function flaggedDisplayNames(names: string[]): string[] {
	return names.filter((name) => containsProfanity(name));
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

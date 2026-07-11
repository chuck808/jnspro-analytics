/**
 * Optimal Set Length Suggestion
 *
 * The gold insight: "How many quality runs should you actually do?"
 */

import type { DropOffAnalysis } from './dropoff';

export interface SetLengthSuggestion {
	optimal: number;
	message: string;
}

export function suggestSetLength(
	dropOff: DropOffAnalysis | null,
	totalRuns: number
): SetLengthSuggestion {
	if (!dropOff) {
		return {
			optimal: totalRuns,
			message: 'No clear drop-off — session length is appropriate'
		};
	}

	return {
		optimal: dropOff.dropOffRun - 1,
		message: `Performance drops after run ${dropOff.dropOffRun}`
	};
}

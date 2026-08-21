import { describe, expect, it } from 'vitest';
import { determineAgeGroup } from './peerComparison';

describe('determineAgeGroup', () => {
	it('keeps under-13 riders out of the 13-17 benchmark cohort', () => {
		expect(determineAgeGroup(8)).toBe('under-13');
		expect(determineAgeGroup(12)).toBe('under-13');
		expect(determineAgeGroup(13)).toBe('13-17');
		expect(determineAgeGroup(17)).toBe('13-17');
	});

	it('preserves the adult benchmark boundaries', () => {
		expect(determineAgeGroup(18)).toBe('18-25');
		expect(determineAgeGroup(26)).toBe('26-35');
		expect(determineAgeGroup(36)).toBe('36-45');
		expect(determineAgeGroup(46)).toBe('46+');
	});
});

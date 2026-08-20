import { describe, expect, it } from 'vitest';
import { shouldExcludeFromStats, type RunTag } from './runs';

describe('shouldExcludeFromStats', () => {
	it.each<[RunTag, boolean]>([
		['warmup', true],
		['experimental', true],
		['competition', true],
		['exclude-from-stats', true],
		['best-effort', false]
	])('classifies %s correctly', (tag, excluded) => {
		expect(shouldExcludeFromStats([tag])).toBe(excluded);
	});

	it('keeps untagged runs statistically eligible', () => {
		expect(shouldExcludeFromStats(null)).toBe(false);
		expect(shouldExcludeFromStats([])).toBe(false);
	});

	it('excludes a run when any exclusion tag is present', () => {
		expect(shouldExcludeFromStats(['best-effort', 'warmup'])).toBe(true);
	});
});

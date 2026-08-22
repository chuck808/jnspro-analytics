import { describe, expect, it } from 'vitest';
import {
	isRideFeel,
	isSessionFocus,
	isTrackSurface,
	isWeatherCondition
} from './sessionContext';

describe('session context taxonomy guards', () => {
	it('accepts the canonical context values', () => {
		expect(isWeatherCondition('light-rain')).toBe(true);
		expect(isTrackSurface('dry-concrete')).toBe(true);
		expect(isSessionFocus('reaction-time')).toBe(true);
		expect(isRideFeel('dialled')).toBe(true);
	});

	it('rejects forged, stale and empty values', () => {
		expect(isWeatherCondition('storm')).toBe(false);
		expect(isTrackSurface('concrete')).toBe(false);
		expect(isSessionFocus('gate-form')).toBe(false);
		expect(isRideFeel('excellent')).toBe(false);
		expect(isRideFeel('')).toBe(false);
		expect(isSessionFocus(null)).toBe(false);
	});
});

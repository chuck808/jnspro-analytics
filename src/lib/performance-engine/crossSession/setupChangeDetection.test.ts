import { describe, expect, it } from 'vitest';
import {
	analyseSetupChange,
	detectMostRecentSetupChange,
	type BikeSnapshot,
	type RiderProfileSnapshot,
	type SetupSession
} from './setupChangeDetection';

const bikeA: BikeSnapshot = {
	id: 1,
	weight_kg: 9.5,
	crank_length_mm: 165,
	chainring_teeth: 25,
	sprocket_teeth: 9,
	front_tire_id: 1,
	rear_tire_id: 1,
	custom_wheel_diameter_inches: null
};

const bikeB: BikeSnapshot = {
	...bikeA,
	id: 2,
	crank_length_mm: 170
};

const bikeC: BikeSnapshot = {
	...bikeB,
	id: 3,
	chainring_teeth: 28
};

const profile1: RiderProfileSnapshot = { id: 1, height_cm: 140, weight_kg: 40 };
const profile2: RiderProfileSnapshot = { id: 2, height_cm: 145, weight_kg: 42 };

function session(overrides: Partial<SetupSession> & { sessionId: string }): SetupSession {
	return {
		date: '2026-01-01',
		bikeId: 1,
		riderProfileId: 1,
		bestReactionTimeSec: 0.3,
		avgSpeedKmh: 20,
		consistencyScore: 80,
		sessionQuality: 70,
		...overrides
	};
}

describe('detectMostRecentSetupChange', () => {
	it('returns null with fewer than 2 sessions', () => {
		const result = detectMostRecentSetupChange(
			[session({ sessionId: 's1' })],
			new Map([[1, bikeA]]),
			new Map([[1, profile1]])
		);
		expect(result).toBeNull();
	});

	it('returns null when the bike/profile ids never change', () => {
		const sessions = [
			session({ sessionId: 's1' }),
			session({ sessionId: 's2' }),
			session({ sessionId: 's3' })
		];
		const result = detectMostRecentSetupChange(
			sessions,
			new Map([[1, bikeA]]),
			new Map([[1, profile1]])
		);
		expect(result).toBeNull();
	});

	it('detects a bike swap with multiple changed fields', () => {
		const sessions = [
			session({ sessionId: 's1', bikeId: 1 }),
			session({ sessionId: 's2', bikeId: 3 })
		];
		const result = detectMostRecentSetupChange(
			sessions,
			new Map([
				[1, bikeA],
				[3, bikeC]
			]),
			new Map([[1, profile1]])
		);
		expect(result?.sessionId).toBe('s2');
		expect(result?.changes).toEqual(
			expect.arrayContaining([
				{ field: 'crank_length_mm', source: 'bike', from: 165, to: 170 },
				{ field: 'chainring_teeth', source: 'bike', from: 25, to: 28 }
			])
		);
	});

	it('detects a profile (biometric) change', () => {
		const sessions = [
			session({ sessionId: 's1', riderProfileId: 1 }),
			session({ sessionId: 's2', riderProfileId: 2 })
		];
		const result = detectMostRecentSetupChange(
			sessions,
			new Map([[1, bikeA]]),
			new Map([
				[1, profile1],
				[2, profile2]
			])
		);
		expect(result?.sessionId).toBe('s2');
		expect(result?.changes).toEqual(
			expect.arrayContaining([
				{ field: 'height_cm', source: 'profile', from: 140, to: 145 },
				{ field: 'profile_weight_kg', source: 'profile', from: 40, to: 42 }
			])
		);
	});

	it('reports only the MOST RECENT change point when there are two changes in history', () => {
		const sessions = [
			session({ sessionId: 's1', bikeId: 1 }),
			session({ sessionId: 's2', bikeId: 2 }), // first change: crank length
			session({ sessionId: 's3', bikeId: 2 }),
			session({ sessionId: 's4', bikeId: 3 }) // second, more recent change: chainring
		];
		const result = detectMostRecentSetupChange(
			sessions,
			new Map([
				[1, bikeA],
				[2, bikeB],
				[3, bikeC]
			]),
			new Map([[1, profile1]])
		);
		expect(result?.sessionId).toBe('s4');
		expect(result?.changes).toEqual([
			{ field: 'chainring_teeth', source: 'bike', from: 25, to: 28 }
		]);
	});
});

describe('analyseSetupChange', () => {
	const bikesById = new Map([
		[1, bikeA],
		[2, bikeB]
	]);
	const profilesById = new Map([[1, profile1]]);

	it('returns status "none" when no change is detected', () => {
		const sessions = [session({ sessionId: 's1' }), session({ sessionId: 's2' })];
		const report = analyseSetupChange(sessions, bikesById, profilesById);
		expect(report.status).toBe('none');
		expect(report.comparison).toBeNull();
	});

	it('returns status "gathering" with the correct shortfall when under 3 sessions on either side', () => {
		const sessions = [
			session({ sessionId: 's1', bikeId: 1 }),
			session({ sessionId: 's2', bikeId: 2 }),
			session({ sessionId: 's3', bikeId: 2 })
		];
		const report = analyseSetupChange(sessions, bikesById, profilesById);
		expect(report.status).toBe('gathering');
		expect(report.event?.sessionId).toBe('s2');
		expect(report.sessionsUntilReady).toBe(2); // before-side has 1 session, needs 3 → shortfall 2
	});

	it('returns status "ready" with correct before/after averages once both sides have >= 3 sessions', () => {
		const sessions = [
			session({ sessionId: 's1', bikeId: 1, bestReactionTimeSec: 0.3 }),
			session({ sessionId: 's2', bikeId: 1, bestReactionTimeSec: 0.32 }),
			session({ sessionId: 's3', bikeId: 1, bestReactionTimeSec: 0.31 }),
			session({ sessionId: 's4', bikeId: 2, bestReactionTimeSec: 0.28 }),
			session({ sessionId: 's5', bikeId: 2, bestReactionTimeSec: 0.27 }),
			session({ sessionId: 's6', bikeId: 2, bestReactionTimeSec: 0.29 })
		];
		const report = analyseSetupChange(sessions, bikesById, profilesById);
		expect(report.status).toBe('ready');
		expect(report.comparison?.beforeCount).toBe(3);
		expect(report.comparison?.afterCount).toBe(3);
		expect(report.comparison?.reactionTime?.isImproving).toBe(true); // lower reaction time after
	});
});

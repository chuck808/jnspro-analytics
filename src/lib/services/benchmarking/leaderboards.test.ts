import { describe, expect, it } from 'vitest';
import { competitionRanks, shapeLeaderboard, type LeaderboardViewRow } from './leaderboards';

describe('competitionRanks', () => {
	it('uses competition ranking for tied values', () => {
		expect(competitionRanks([250, 250, 260, 270, 270])).toEqual([1, 1, 3, 4, 4]);
	});
});

describe('shapeLeaderboard', () => {
	const row = (
		userId: string,
		reaction: number | null,
		speed: number | null = null
	): LeaderboardViewRow => ({
		user_id: userId,
		display_name: userId,
		age_group: '18-25',
		experience_level: 'beginner',
		session_count: 3,
		best_reaction_ms: reaction,
		best_peak_speed_ms: speed,
		best_max_g: null,
		best_consistency: null
	});

	it('keeps displayed reaction ranks consistent with strictly-better fallback semantics', () => {
		const result = shapeLeaderboard(
			[row('a', 250), row('b', 250), row('c', 260), row('d', null)],
			{ metric: 'reactionTime', timePeriod: 'all_time' },
			'b'
		);

		expect(result.entries.map((entry) => entry.rank)).toEqual([1, 1, 3]);
		expect(result.userRank).toBe(1);
		expect(result.totalEntries).toBe(3);
	});

	it('applies the same tie rule when higher values are better', () => {
		const result = shapeLeaderboard(
			[row('a', null, 10), row('b', null, 12), row('c', null, 12), row('d', null, 8)],
			{ metric: 'peakSpeed', timePeriod: 'all_time' },
			'c'
		);

		expect(result.entries.map((entry) => [entry.userId, entry.rank])).toEqual([
			['b', 1],
			['c', 1],
			['a', 3],
			['d', 4]
		]);
		expect(result.userRank).toBe(1);
	});
});

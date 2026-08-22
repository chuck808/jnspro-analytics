import { describe, expect, it } from 'vitest';
import {
	buildCoachRosterProjection,
	type CoachRosterGoal,
	type CoachRosterLink,
	type CoachRosterMessage,
	type CoachRosterRider,
	type CoachRosterShare
} from './coachWorkspaceProjection';

function base(): {
	links: CoachRosterLink[];
	riders: CoachRosterRider[];
	shares: CoachRosterShare[];
	messages: CoachRosterMessage[];
	goals: CoachRosterGoal[];
} {
	return {
		links: [
			{ id: 'l1', rider_id: 'r1', status: 'active', invited_at: '2026-08-01T10:00:00Z' }
		],
		riders: [{ id: 'r1', name: 'Rider One', email: 'rider@example.com' }],
		shares: [],
		messages: [],
		goals: []
	};
}

describe('buildCoachRosterProjection', () => {
	it('prioritises unread rider-shared evidence without inferring session activity', () => {
		const input = base();
		input.shares.push(
			{ link_id: 'l1', created_at: '2026-08-10T10:00:00Z', viewed_at: '2026-08-10T11:00:00Z' },
			{ link_id: 'l1', created_at: '2026-08-12T10:00:00Z', viewed_at: null }
		);

		const [row] = buildCoachRosterProjection(input);
		expect(row.attention).toBe('new_shared_evidence');
		expect(row.unreadCount).toBe(1);
		expect(row.latestShareAt).toBe('2026-08-12T10:00:00Z');
	});

	it('surfaces unresolved profile flags after shared evidence has been read', () => {
		const input = base();
		input.shares.push({
			link_id: 'l1',
			created_at: '2026-08-12T10:00:00Z',
			viewed_at: '2026-08-12T11:00:00Z'
		});
		input.messages.push(
			{ link_id: 'l1', message_type: 'message', resolved_at: null },
			{ link_id: 'l1', message_type: 'profile_flag', resolved_at: null },
			{ link_id: 'l1', message_type: 'profile_flag', resolved_at: '2026-08-13T10:00:00Z' }
		);

		const [row] = buildCoachRosterProjection(input);
		expect(row.attention).toBe('profile_flag_open');
		expect(row.unresolvedProfileFlags).toBe(1);
	});

	it('keeps pending consent states distinct from active coaching', () => {
		const input = base();
		input.links = [
			{ id: 'l1', rider_id: 'r1', status: 'pending_rider', invited_at: null },
			{ id: 'l2', rider_id: 'r2', status: 'pending_parent', invited_at: null }
		];
		input.riders.push({ id: 'r2', name: 'Rider Two', email: null });

		const rows = buildCoachRosterProjection(input);
		expect(rows[0].attention).toBe('awaiting_rider');
		expect(rows[1].attention).toBe('awaiting_parent');
	});

	it('reports goal counts from the coach-visible goal model without treating them as urgent', () => {
		const input = base();
		input.goals.push(
			{ user_id: 'r1', completed_at: null },
			{ user_id: 'r1', completed_at: null },
			{ user_id: 'r1', completed_at: '2026-08-15T10:00:00Z' }
		);

		const [row] = buildCoachRosterProjection(input);
		expect(row.activeGoalCount).toBe(2);
		expect(row.attention).toBe('no_shared_reports');
	});
});

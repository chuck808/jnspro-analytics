export type CoachLinkStatus =
	| 'pending_rider'
	| 'pending_parent'
	| 'active'
	| 'declined'
	| 'denied'
	| 'revoked'
	| string;

export interface CoachRosterLink {
	id: string;
	rider_id: string;
	status: CoachLinkStatus;
	invited_at: string | null;
}

export interface CoachRosterRider {
	id: string;
	name: string | null;
	email: string | null;
}

export interface CoachRosterShare {
	link_id: string;
	created_at: string;
	viewed_at: string | null;
}

export interface CoachRosterMessage {
	link_id: string;
	message_type: string;
	resolved_at: string | null;
}

export interface CoachRosterGoal {
	user_id: string;
	completed_at: string | null;
}

export type CoachAttentionKind =
	| 'awaiting_parent'
	| 'awaiting_rider'
	| 'new_shared_evidence'
	| 'profile_flag_open'
	| 'no_shared_reports'
	| 'active'
	| 'inactive';

export interface CoachRosterProjection {
	linkId: string;
	riderId: string;
	riderName: string;
	riderEmail: string | null;
	status: CoachLinkStatus;
	invitedAt: string | null;
	unreadCount: number;
	latestShareAt: string | null;
	unresolvedProfileFlags: number;
	activeGoalCount: number;
	attention: CoachAttentionKind;
	attentionRank: number;
}

function newestTimestamp(values: string[]): string | null {
	if (values.length === 0) return null;
	return values.reduce((latest, value) => (Date.parse(value) > Date.parse(latest) ? value : latest));
}

function attentionFor(input: {
	status: CoachLinkStatus;
	unreadCount: number;
	unresolvedProfileFlags: number;
	latestShareAt: string | null;
}): { attention: CoachAttentionKind; rank: number } {
	if (input.status === 'pending_parent') return { attention: 'awaiting_parent', rank: 60 };
	if (input.status === 'pending_rider') return { attention: 'awaiting_rider', rank: 50 };
	if (input.status !== 'active') return { attention: 'inactive', rank: 0 };
	if (input.unreadCount > 0) return { attention: 'new_shared_evidence', rank: 100 };
	if (input.unresolvedProfileFlags > 0) return { attention: 'profile_flag_open', rank: 80 };
	if (input.latestShareAt === null) return { attention: 'no_shared_reports', rank: 30 };
	return { attention: 'active', rank: 10 };
}

/**
 * Canonical coach-roster projection using only information already available
 * under the existing consent/RLS model. It deliberately does not infer rider
 * training activity from sessions/runs, because coaches do not currently have
 * automatic access to that evidence.
 */
export function buildCoachRosterProjection(input: {
	links: CoachRosterLink[];
	riders: CoachRosterRider[];
	shares: CoachRosterShare[];
	messages: CoachRosterMessage[];
	goals: CoachRosterGoal[];
}): CoachRosterProjection[] {
	const riderById = new Map(input.riders.map((rider) => [rider.id, rider]));

	const sharesByLink = new Map<string, CoachRosterShare[]>();
	for (const share of input.shares) {
		const current = sharesByLink.get(share.link_id) ?? [];
		current.push(share);
		sharesByLink.set(share.link_id, current);
	}

	const unresolvedFlagsByLink = new Map<string, number>();
	for (const message of input.messages) {
		if (message.message_type !== 'profile_flag' || message.resolved_at !== null) continue;
		unresolvedFlagsByLink.set(message.link_id, (unresolvedFlagsByLink.get(message.link_id) ?? 0) + 1);
	}

	const activeGoalsByRider = new Map<string, number>();
	for (const goal of input.goals) {
		if (goal.completed_at !== null) continue;
		activeGoalsByRider.set(goal.user_id, (activeGoalsByRider.get(goal.user_id) ?? 0) + 1);
	}

	return input.links.map((link) => {
		const rider = riderById.get(link.rider_id);
		const shares = sharesByLink.get(link.id) ?? [];
		const unreadCount = shares.filter((share) => share.viewed_at === null).length;
		const latestShareAt = newestTimestamp(shares.map((share) => share.created_at));
		const unresolvedProfileFlags = unresolvedFlagsByLink.get(link.id) ?? 0;
		const { attention, rank } = attentionFor({
			status: link.status,
			unreadCount,
			unresolvedProfileFlags,
			latestShareAt
		});

		return {
			linkId: link.id,
			riderId: link.rider_id,
			riderName: rider?.name ?? 'Unknown',
			riderEmail: rider?.email ?? null,
			status: link.status,
			invitedAt: link.invited_at,
			unreadCount,
			latestShareAt,
			unresolvedProfileFlags,
			activeGoalCount: activeGoalsByRider.get(link.rider_id) ?? 0,
			attention,
			attentionRank: rank
		};
	});
}

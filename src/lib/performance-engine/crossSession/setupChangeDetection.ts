/**
 * Performance Engine — Setup Change Detection
 *
 * Answers: "Did the rider's bike or biometrics change, and did it help?"
 *
 * Unlike contextualPatterns.ts (which looks for recurring, alternating
 * conditions across history — wet vs dry, several session focuses), this
 * module looks for a single monotonic regime change: the most recent point
 * where a tracked bike/profile field differs from the session immediately
 * before it. Everything before that point is "before," everything after is
 * "after" — there's no grouping or ranking, since a gearing swap doesn't
 * recur and alternate the way weather does.
 *
 * Detection is fully automatic, driven entirely by sessions.bike_id /
 * sessions.rider_profile_id snapshots already resolved at upload time (see
 * src/routes/api/upload/+server.ts, src/routes/api/device-ingest/+server.ts).
 * There is deliberately no rider confirmation/tagging step — the whole point
 * is zero manual burden. This means result quality depends entirely on the
 * rider keeping their profile/bike setup current *before* riding, not after;
 * see the profile chapter docs for why that's called out explicitly to riders.
 */

import {
	formatMetricComparison,
	formatReactionComparison,
	formatSpeedComparison,
	formatConsistencyComparison,
	type FormattedComparison
} from './comparisonFormatting';

/** Reuses the existing MIN_CONDITION_SESSIONS convention from contextualPatterns.ts */
const MIN_SESSIONS_EACH_SIDE = 3;

export interface BikeSnapshot {
	id: number;
	weight_kg: number | null;
	crank_length_mm: number | null;
	chainring_teeth: number;
	sprocket_teeth: number;
	front_tire_id: number | null;
	rear_tire_id: number | null;
	custom_wheel_diameter_inches: number | null;
}

export interface RiderProfileSnapshot {
	id: number;
	height_cm: number | null;
	weight_kg: number | null;
}

export interface SetupSession {
	sessionId: string;
	date: string | Date;
	bikeId: number | null;
	riderProfileId: number | null;
	bestReactionTimeSec: number | null;
	avgSpeedKmh: number | null;
	/** Higher is better — e.g. 100 - reaction_cv, or a true repeatability score */
	consistencyScore: number | null;
	sessionQuality: number | null;
}

export type ChangedField =
	| 'weight_kg'
	| 'crank_length_mm'
	| 'chainring_teeth'
	| 'sprocket_teeth'
	| 'front_tire_id'
	| 'rear_tire_id'
	| 'custom_wheel_diameter_inches'
	| 'height_cm'
	| 'profile_weight_kg';

export interface FieldChange {
	field: ChangedField;
	source: 'bike' | 'profile';
	from: number | null;
	to: number | null;
}

export interface SetupChangeEvent {
	/** First session ridden with the new setup */
	sessionId: string;
	date: string | Date;
	changes: FieldChange[];
}

export interface SetupChangeComparison {
	reactionTime: FormattedComparison | null;
	speed: FormattedComparison | null;
	consistency: FormattedComparison | null;
	sessionQuality: FormattedComparison | null;
	beforeCount: number;
	afterCount: number;
}

export interface SetupChangeReport {
	status: 'none' | 'gathering' | 'ready';
	event: SetupChangeEvent | null;
	comparison: SetupChangeComparison | null;
	/** Only set when status === 'gathering' */
	sessionsUntilReady: number | null;
}

/** Cosmetic fields (name, notes) are deliberately excluded — only spec fields count. */
const TRACKED_BIKE_FIELDS: Exclude<keyof BikeSnapshot, 'id'>[] = [
	'weight_kg',
	'crank_length_mm',
	'chainring_teeth',
	'sprocket_teeth',
	'front_tire_id',
	'rear_tire_id',
	'custom_wheel_diameter_inches'
];

/**
 * Walk chronologically-sorted sessions (oldest first) and find the most
 * recent point where the resolved bike or rider_profile snapshot differs
 * from the prior session. Returns null if no change is found (or fewer than
 * 2 sessions exist to compare).
 */
export function detectMostRecentSetupChange(
	sessions: SetupSession[],
	bikesById: Map<number, BikeSnapshot>,
	profilesById: Map<number, RiderProfileSnapshot>
): SetupChangeEvent | null {
	if (sessions.length < 2) return null;

	let found: SetupChangeEvent | null = null;

	for (let i = 1; i < sessions.length; i++) {
		const prev = sessions[i - 1];
		const curr = sessions[i];
		const changes: FieldChange[] = [];

		const prevBike = prev.bikeId !== null ? bikesById.get(prev.bikeId) : null;
		const currBike = curr.bikeId !== null ? bikesById.get(curr.bikeId) : null;
		if (prevBike && currBike && prevBike.id !== currBike.id) {
			for (const field of TRACKED_BIKE_FIELDS) {
				if (prevBike[field] !== currBike[field]) {
					changes.push({
						field,
						source: 'bike',
						from: prevBike[field] as number | null,
						to: currBike[field] as number | null
					});
				}
			}
		}

		const prevProfile = prev.riderProfileId !== null ? profilesById.get(prev.riderProfileId) : null;
		const currProfile = curr.riderProfileId !== null ? profilesById.get(curr.riderProfileId) : null;
		if (prevProfile && currProfile && prevProfile.id !== currProfile.id) {
			if (prevProfile.height_cm !== currProfile.height_cm) {
				changes.push({
					field: 'height_cm',
					source: 'profile',
					from: prevProfile.height_cm,
					to: currProfile.height_cm
				});
			}
			if (prevProfile.weight_kg !== currProfile.weight_kg) {
				changes.push({
					field: 'profile_weight_kg',
					source: 'profile',
					from: prevProfile.weight_kg,
					to: currProfile.weight_kg
				});
			}
		}

		// Keep walking — later matches overwrite earlier ones, since we only
		// want the MOST RECENT change point, not the first one in history.
		if (changes.length > 0) {
			found = { sessionId: curr.sessionId, date: curr.date, changes };
		}
	}

	return found;
}

/**
 * Build the full report: change event + before/after comparison once enough
 * sessions exist on both sides, or a "gathering data" status otherwise.
 */
export function analyseSetupChange(
	sessions: SetupSession[],
	bikesById: Map<number, BikeSnapshot>,
	profilesById: Map<number, RiderProfileSnapshot>
): SetupChangeReport {
	const event = detectMostRecentSetupChange(sessions, bikesById, profilesById);
	if (!event) return { status: 'none', event: null, comparison: null, sessionsUntilReady: null };

	const changeIndex = sessions.findIndex((s) => s.sessionId === event.sessionId);
	const before = sessions.slice(0, changeIndex);
	const after = sessions.slice(changeIndex); // the change-point session itself counts as "after"

	if (before.length < MIN_SESSIONS_EACH_SIDE || after.length < MIN_SESSIONS_EACH_SIDE) {
		const shortfall = MIN_SESSIONS_EACH_SIDE - Math.min(before.length, after.length);
		return {
			status: 'gathering',
			event,
			comparison: null,
			sessionsUntilReady: Math.max(shortfall, 1)
		};
	}

	const comparison: SetupChangeComparison = {
		reactionTime: formatReactionComparison(
			average(before.map((s) => s.bestReactionTimeSec)),
			average(after.map((s) => s.bestReactionTimeSec))
		),
		speed: formatSpeedComparison(
			average(before.map((s) => s.avgSpeedKmh)),
			average(after.map((s) => s.avgSpeedKmh))
		),
		consistency: formatConsistencyComparison(
			average(before.map((s) => s.consistencyScore)),
			average(after.map((s) => s.consistencyScore))
		),
		sessionQuality: formatMetricComparison(
			average(before.map((s) => s.sessionQuality)),
			average(after.map((s) => s.sessionQuality)),
			{ label: 'Session quality', direction: 'higher-is-better', decimals: 0 }
		),
		beforeCount: before.length,
		afterCount: after.length
	};

	return { status: 'ready', event, comparison, sessionsUntilReady: null };
}

function average(values: (number | null)[]): number | null {
	const nums = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
	if (nums.length === 0) return null;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

import { calculateTrend } from '$lib/performance-engine/crossSession/trendUtils';

export type DropOffTrendState = 'measured' | 'observed-history' | 'early-signal' | 'supported-finding';
export type DropOffBand = 'early' | 'mid' | 'late';

export interface DropOffSessionAnalysisLike {
	sessionId: string;
	timestamp: string;
	analysis: {
		intelligence?: {
			dropOff: { dropOffRun: number; dropPercent: number } | null;
			performancePersistence: { supportedRunCount: number };
		} | null;
	};
}

export interface DropOffEvidenceModel {
	totalSessionCount: number;
	eligibleSessionCount: number;
	detectedSessionCount: number;
	notDetectedSessionCount: number;
	detectionRate: { percent: number } | null;
	distribution: { early: number; mid: number; late: number };
	history: Array<{
		sessionId: string;
		timestamp: string;
		dropOffRun: number;
		dropPercent: number;
		band: DropOffBand;
	}>;
	trendState: DropOffTrendState;
	windowSize: number;
	finding: null | {
		direction: 'later' | 'earlier' | 'stable';
		changePercent: number;
		recentRun: number;
		historicalRun: number;
	};
	presentation: {
		detectionStatement: string;
		distributionLabel: 'Measured' | 'Observed history' | 'Early signal' | 'Supported finding';
		distributionStatement: string;
	};
}

/** A session must have at least this many speed-supported runs before
 *  detectDropOff() can structurally evaluate it at all — mirrors that
 *  function's own internal floor (dropoff.ts: `values.length < 4`), not a
 *  new number. Below this, a null dropOff tells us nothing and must not be
 *  counted toward the detection rate. */
const ELIGIBLE_RUN_FLOOR = 4;

/** Minimum eligible sessions before a detection rate is reported at all — a
 *  plain fraction, not a trend, so it doesn't need the full four-stage ladder. */
const ELIGIBLE_SESSION_FLOOR = 3;

const RECENT_WINDOW = 5;

function bandFor(dropOffRun: number): DropOffBand {
	if (dropOffRun >= 8) return 'late';
	if (dropOffRun >= 5) return 'mid';
	return 'early';
}

function describeDropOffEvidence(
	eligibleCount: number,
	detectedCount: number,
	trendState: DropOffTrendState,
	windowSize: number,
	finding: DropOffEvidenceModel['finding']
): DropOffEvidenceModel['presentation'] {
	const notDetected = eligibleCount - detectedCount;

	const detectionStatement =
		eligibleCount === 0
			? 'No sessions yet have enough valid speed runs to check for a fade. This will fill in as sessions are recorded.'
			: eligibleCount < ELIGIBLE_SESSION_FLOOR
				? `${eligibleCount} session${eligibleCount === 1 ? ' has' : 's have'} enough evidence to check for a fade, but at least ${ELIGIBLE_SESSION_FLOOR} are needed before reporting a rate.`
				: detectedCount === 0
					? `No fade has been detected in any of the ${eligibleCount} eligible sessions. That's a genuinely good result, not missing data — speed has held up through every checked session.`
					: `A fade was detected in ${detectedCount} of ${eligibleCount} eligible sessions. The remaining ${notDetected} showed no fade at all.`;

	if (trendState === 'measured') {
		return {
			detectionStatement,
			distributionLabel: 'Measured',
			distributionStatement:
				detectedCount === 0
					? "No fades have been detected yet, so there's no landing pattern to show — that reflects sustained pace, not missing evidence."
					: '1 detected fade establishes a baseline landing point. Another detected fade will unlock observed history.'
		};
	}

	if (trendState === 'observed-history') {
		return {
			detectionStatement,
			distributionLabel: 'Observed history',
			distributionStatement: `${detectedCount} detected fades show a landing-point history. No trend claim yet.`
		};
	}

	if (!finding) {
		return {
			detectionStatement,
			distributionLabel: trendState === 'early-signal' ? 'Early signal' : 'Supported finding',
			distributionStatement: `${detectedCount} detected fades are available, but no directional finding is currently supported.`
		};
	}

	const comparison =
		finding.direction === 'stable'
			? 'broadly stable against'
			: `${Math.abs(finding.changePercent).toFixed(1)}% ${finding.direction === 'later' ? 'later than' : 'earlier than'}`;
	const window = `within the latest ${windowSize} detected fade${windowSize === 1 ? '' : 's'}`;

	if (trendState === 'early-signal') {
		return {
			detectionStatement,
			distributionLabel: 'Early signal',
			distributionStatement: `Recent fade position appears ${comparison} the earlier comparison ${window}.`
		};
	}

	return {
		detectionStatement,
		distributionLabel: 'Supported finding',
		distributionStatement: `Recent fade position is ${comparison} the earlier comparison ${window}.`
	};
}

/**
 * Build the rider-facing Drop-Off Position evidence boundary for /progress-next.
 *
 * detectDropOff() (src/lib/performance-engine/dropoff.ts) returns null in two
 * structurally different situations that look identical from the field alone:
 * a session that genuinely never faded (real good news), and a session with
 * too few speed-supported runs for the check to run at all (tells us nothing).
 * This adapter gates eligibility on performancePersistence.supportedRunCount
 * before either count is trusted, so a pile of short warm-up sessions can
 * never fabricate a false "no fade" rate. Detection rate and landing-position
 * trend are two genuinely independent questions with different denominators —
 * not a manufactured second axis — and null-as-no-detection is treated as
 * positive evidence throughout, never as an absence-of-evidence gap.
 */
export function buildDropOffEvidence(sessionAnalyses: DropOffSessionAnalysisLike[]): DropOffEvidenceModel {
	const eligible = sessionAnalyses.filter(
		(session) =>
			session.analysis.intelligence != null &&
			session.analysis.intelligence.performancePersistence.supportedRunCount >= ELIGIBLE_RUN_FLOOR
	);
	const detected = eligible.filter((session) => session.analysis.intelligence!.dropOff !== null);

	const detectionRate =
		eligible.length >= ELIGIBLE_SESSION_FLOOR ? { percent: (detected.length / eligible.length) * 100 } : null;

	const history = detected.map((session) => {
		const dropOff = session.analysis.intelligence!.dropOff!;
		return {
			sessionId: session.sessionId,
			timestamp: session.timestamp,
			dropOffRun: dropOff.dropOffRun,
			dropPercent: dropOff.dropPercent,
			band: bandFor(dropOff.dropOffRun)
		};
	});

	const distribution = history.reduce(
		(acc, entry) => {
			acc[entry.band] += 1;
			return acc;
		},
		{ early: 0, mid: 0, late: 0 }
	);

	let trendState: DropOffTrendState = 'measured';
	if (detected.length === 2) trendState = 'observed-history';
	else if (detected.length >= 3 && detected.length < 5) trendState = 'early-signal';
	else if (detected.length >= 5) trendState = 'supported-finding';

	const recentHistory = history.slice(-RECENT_WINDOW);
	let finding: DropOffEvidenceModel['finding'] = null;
	if (detected.length >= 3) {
		const trend = calculateTrend(
			recentHistory.map((entry) => entry.dropOffRun),
			{ higherIsBetter: true }
		);
		if (
			trend.direction !== 'unknown' &&
			trend.changePercent !== null &&
			trend.recent !== null &&
			trend.historical !== null
		) {
			finding = {
				direction: trend.direction === 'stable' ? 'stable' : trend.improving ? 'later' : 'earlier',
				changePercent: trend.changePercent,
				recentRun: trend.recent,
				historicalRun: trend.historical
			};
		}
	}

	const windowSize = Math.min(recentHistory.length, RECENT_WINDOW);

	return {
		totalSessionCount: sessionAnalyses.length,
		eligibleSessionCount: eligible.length,
		detectedSessionCount: detected.length,
		notDetectedSessionCount: eligible.length - detected.length,
		detectionRate,
		distribution,
		history,
		trendState,
		windowSize,
		finding,
		presentation: describeDropOffEvidence(eligible.length, detected.length, trendState, windowSize, finding)
	};
}

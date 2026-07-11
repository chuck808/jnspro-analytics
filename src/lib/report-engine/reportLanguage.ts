/**
 * src/lib/report-engine/reportLanguage.ts
 *
 * Language layer for the report engine.
 *
 * Core principle: every output must be understandable, informative, and actionable.
 *   - Understandable: no jargon without explanation, no numbers without context
 *   - Informative: says WHY not just WHAT
 *   - Actionable: leaves the reader knowing what to do next (or confirms they're on track)
 *
 * Detail levels:
 *   simple   — rider or parent, plain language, one focus point
 *   standard — club rider, some technical context, clear recommendations
 *   coach    — full coaching context, technique-outcome links, data confidence
 *   technical — all metrics, raw values, diagnostic detail
 *
 * Rules:
 *   - Never show a number without telling the reader what it means
 *   - Never flag a problem without suggesting what to do about it
 *   - Never present derived metrics (speed, power) without noting they're estimates
 *   - Conflict-aware: don't say "great session" if consistency dropped
 *   - Honest about data quality: flag limitations before they mislead
 */

import type { ReportDetailLevel } from './types';

// ─── Detail level helpers ─────────────────────────────────────────────────────

export function isSimple(level: ReportDetailLevel) {
	return level === 'simple';
}
export function isCoach(level: ReportDetailLevel) {
	return level === 'coach' || level === 'technical';
}

// ─── Session quality language ─────────────────────────────────────────────────

export interface SessionQualityInput {
	sessionQuality: number | null;
	repeatability: number | null;
	bestVsAvgGap: number | null;
	optimalSetLength: number | null;
	dropOffRun: number | null;
	runCount: number;
}

export function sessionQualityHeadline(input: SessionQualityInput): string {
	const q = input.sessionQuality;
	if (q === null) return 'Session quality could not be calculated.';

	if (q >= 80) return 'Strong, consistent session.';
	if (q >= 65) return 'Solid session with room to tighten up.';
	if (q >= 50) return 'Mixed session — some good runs, some variation.';
	if (q >= 35) return 'Variable session — consistency needs attention.';
	return 'Difficult session — significant variation across runs.';
}

export function sessionQualitySummary(
	input: SessionQualityInput,
	level: ReportDetailLevel
): string[] {
	const lines: string[] = [];
	const { sessionQuality: q, bestVsAvgGap, optimalSetLength, dropOffRun, runCount } = input;

	if (q === null) {
		lines.push('Not enough data to calculate a session quality score.');
		return lines;
	}

	// Quality score in plain language
	if (isSimple(level)) {
		if (q >= 80)
			lines.push(
				'Your starts were very consistent this session — the quality stayed high across all your runs.'
			);
		else if (q >= 65)
			lines.push('Most of your runs were good, with a bit of variation between them.');
		else if (q >= 50)
			lines.push('Some strong runs and some weaker ones — your quality varied quite a bit.');
		else lines.push('Your reaction times and performance varied a lot between runs this session.');
	} else {
		lines.push(
			`Session quality score: ${q}/100. ${q >= 70 ? 'This reflects consistent execution across the session.' : q >= 50 ? 'Some variability in execution across runs.' : 'Significant variability — performance was not repeatable this session.'}`
		);
	}

	// Best vs average gap
	if (bestVsAvgGap !== null) {
		if (isSimple(level)) {
			if (bestVsAvgGap < 5)
				lines.push("Your best run and your average run were very close — that's what you want.");
			else if (bestVsAvgGap < 12)
				lines.push(
					`Your best run was about ${bestVsAvgGap.toFixed(0)}% better than your average — there\'s some gap to close.`
				);
			else
				lines.push(
					`There\'s a big gap between your best run and your typical run (${bestVsAvgGap.toFixed(0)}%). The focus should be on making the average better, not chasing one perfect start.`
				);
		} else {
			if (bestVsAvgGap < 5)
				lines.push(
					`Best-vs-average gap: ${bestVsAvgGap.toFixed(1)}% — excellent. The rider is executing consistently, not just peak-chasing.`
				);
			else if (bestVsAvgGap < 12)
				lines.push(
					`Best-vs-average gap: ${bestVsAvgGap.toFixed(1)}% — moderate. There\'s meaningful performance left in the typical run.`
				);
			else
				lines.push(
					`Best-vs-average gap: ${bestVsAvgGap.toFixed(1)}% — wide. The rider\'s peak performance significantly exceeds their typical output. Focus should shift to floor-raising over peak-chasing.`
				);
		}
	}

	// Optimal set length
	if (optimalSetLength !== null && runCount > 2) {
		if (isSimple(level)) {
			if (optimalSetLength >= runCount) {
				lines.push(
					'Your quality held up across all your runs — no sign of fatigue in this session.'
				);
			} else {
				lines.push(
					`Your starts were strongest in the first ${optimalSetLength} run${optimalSetLength === 1 ? '' : 's'}. After that, quality started to drop.`
				);
			}
		} else {
			if (optimalSetLength >= runCount) {
				lines.push(`Set capacity held for all ${runCount} runs — no quality drop-off detected.`);
			} else {
				lines.push(
					`Optimal set length: ${optimalSetLength} run${optimalSetLength === 1 ? '' : 's'}. Quality begins to deteriorate beyond this point.`
				);
			}
		}
	}

	// Drop-off
	if (dropOffRun !== null && dropOffRun <= runCount) {
		if (isSimple(level)) {
			lines.push(
				`Run ${dropOffRun} is where performance started to drop off. Ending sets before this point would keep your training quality higher.`
			);
		} else {
			lines.push(
				`Drop-off detected at run ${dropOffRun}. Runs beyond this point show >10% decline from session best. Consider ending sets at run ${Math.max(1, dropOffRun - 1)} to preserve quality.`
			);
		}
	}

	return lines;
}

// ─── Repeatability language ───────────────────────────────────────────────────

export interface RepeatabilityInput {
	score: number | null;
	cvPercent: number | null;
	label: string | null;
}

export function repeatabilitySection(
	input: RepeatabilityInput,
	level: ReportDetailLevel
): string[] {
	const lines: string[] = [];
	const { score, cvPercent, label } = input;

	if (score === null) {
		lines.push('Consistency could not be calculated for this session.');
		return lines;
	}

	if (isSimple(level)) {
		if (score >= 80)
			lines.push("Your reaction times were very consistent — you're producing reliable starts.");
		else if (score >= 60)
			lines.push(
				'Your reaction times were reasonably consistent. Some variation between runs, but nothing dramatic.'
			);
		else if (score >= 40)
			lines.push(
				'Your reaction times varied quite a bit. Working on a consistent pre-gate routine should help.'
			);
		else
			lines.push(
				'Significant variation in reaction times across the session. Focus on your preparation routine before each start.'
			);
	} else {
		const cvText = cvPercent !== null ? ` (CV: ${cvPercent.toFixed(1)}%)` : '';
		const labelText = label ? ` — ${label}` : '';
		lines.push(`Repeatability score: ${score}/100${cvText}${labelText}.`);

		if (cvPercent !== null) {
			if (cvPercent < 2)
				lines.push(
					'Outstanding consistency. This level of repeatability under training conditions transfers well to race performance.'
				);
			else if (cvPercent < 5)
				lines.push(
					'Good consistency. Minor refinement of the pre-gate routine may tighten this further.'
				);
			else if (cvPercent < 10)
				lines.push(
					"Moderate variation. The preparation state isn't fully stable — review pre-gate routine."
				);
			else
				lines.push(
					'High variation. This level of inconsistency will produce unpredictable race results. Pre-gate routine needs deliberate work.'
				);
		}
	}

	return lines;
}

// ─── Technique language ───────────────────────────────────────────────────────

export interface TechniqueInput {
	overall: number | null;
	reaction: number | null;
	explosiveness: number | null;
	smoothness: number | null;
	efficiency: number | null;
	riderLevel: string | null;
}

export function techniqueSection(input: TechniqueInput, level: ReportDetailLevel): string[] {
	const lines: string[] = [];
	const { overall, reaction, explosiveness, smoothness, efficiency, riderLevel } = input;

	if (overall === null) {
		lines.push('Technique scores were not available for this session.');
		return lines;
	}

	const levelText = riderLevel ? ` for ${riderLevel} level` : '';

	if (isSimple(level)) {
		if (overall >= 80) lines.push(`Your technique was strong this session${levelText}.`);
		else if (overall >= 65)
			lines.push(`Your technique was solid${levelText} with a couple of areas to work on.`);
		else if (overall >= 50)
			lines.push(
				`There\'s room to improve your technique${levelText}. The focus areas below are worth working on.`
			);
		else
			lines.push(
				`Your technique needs some work${levelText}. Don\'t be discouraged — these are coachable things.`
			);
	} else {
		lines.push(`Overall technique score: ${overall}/100${levelText}.`);
	}

	// Identify the weakest component and lead with it
	const components = [
		{ name: 'Reaction', score: reaction },
		{ name: 'Explosiveness', score: explosiveness },
		{ name: 'Smoothness', score: smoothness },
		{ name: 'Efficiency', score: efficiency }
	].filter((c) => c.score !== null) as { name: string; score: number }[];

	if (components.length === 0) return lines;

	const weakest = components.reduce((a, b) => (a.score < b.score ? a : b));
	const strongest = components.reduce((a, b) => (a.score > b.score ? a : b));

	if (isSimple(level)) {
		if (strongest.score >= 75)
			lines.push(
				`Your strongest area is ${strongest.name.toLowerCase()} — keep doing what you\'re doing there.`
			);
		if (weakest.score < 60)
			lines.push(
				`The main area to focus on is ${weakest.name.toLowerCase()} — that\'s where the most improvement is available.`
			);
	} else {
		// Coach-level: describe the pattern, not just the scores
		const lowComponents = components.filter((c) => c.score < 60);
		const highComponents = components.filter((c) => c.score >= 75);

		if (highComponents.length > 0 && lowComponents.length > 0) {
			lines.push(
				`Strong ${highComponents.map((c) => c.name.toLowerCase()).join(' and ')}, weaker ${lowComponents.map((c) => c.name.toLowerCase()).join(' and ')}. ${techniquePatternInsight(input)}`
			);
		} else if (lowComponents.length === 0) {
			lines.push(`All technique components above threshold. ${techniquePatternInsight(input)}`);
		} else {
			lines.push(
				`Multiple technique components below threshold. ${techniquePatternInsight(input)}`
			);
		}
	}

	return lines;
}

function techniquePatternInsight(input: TechniqueInput): string {
	const { reaction, explosiveness, smoothness, efficiency } = input;

	// Classic patterns
	if (reaction !== null && explosiveness !== null && reaction < 60 && explosiveness >= 70) {
		return 'Late reaction but strong drive — the preparation routine needs work, not the physical output.';
	}
	if (explosiveness !== null && smoothness !== null && explosiveness >= 75 && smoothness < 55) {
		return 'Explosive start but choppy force delivery — power is there, but technique is costing efficiency.';
	}
	if (smoothness !== null && explosiveness !== null && smoothness >= 75 && explosiveness < 55) {
		return 'Smooth but underpowered — technique is solid, the limiting factor is first-stroke force.';
	}
	if (efficiency !== null && explosiveness !== null && efficiency < 55 && explosiveness >= 70) {
		return 'Force is being generated but not converting into speed — body position or timing may be the issue.';
	}
	if (
		reaction !== null &&
		efficiency !== null &&
		reaction >= 75 &&
		efficiency >= 75 &&
		explosiveness !== null &&
		explosiveness < 55
	) {
		return 'Quick reaction and efficient conversion, but limited initial force. Strength work may be the next lever.';
	}

	return '';
}

// ─── Data quality language ────────────────────────────────────────────────────

export interface DataQualityInput {
	label: string | null;
	biasCorrection: number | null;
	analyticsValid: boolean;
	blocksPower: boolean;
	blocksSpeed: boolean;
}

export function dataQualitySection(input: DataQualityInput, level: ReportDetailLevel): string[] {
	const lines: string[] = [];
	const { label, biasCorrection, analyticsValid, blocksPower, blocksSpeed } = input;

	if (analyticsValid && biasCorrection !== null && biasCorrection < 0.5) {
		if (!isSimple(level)) lines.push('Data quality: Excellent. All derived metrics are reliable.');
		return lines; // Don't clutter simple reports with good news notes
	}

	if (isSimple(level)) {
		if (!analyticsValid) {
			lines.push(
				"Some speed and power figures weren't available for this session — the sensor data wasn't reliable enough to calculate them. Reaction time and G-force are not affected."
			);
		} else if (blocksSpeed || blocksPower) {
			lines.push(
				'Speed and power estimates are approximate for this session. Reaction time and G-force remain accurate.'
			);
		}
		return lines;
	}

	// Coach/technical level
	const qualityText = label ?? (analyticsValid ? 'Fair' : 'Invalid');
	lines.push(`Data quality: ${qualityText}.`);

	if (biasCorrection !== null) {
		if (biasCorrection < 0.5) {
			lines.push(
				`Bias correction: ${biasCorrection.toFixed(3)} m/s² — excellent calibration. Integrated speed is reliable.`
			);
		} else if (biasCorrection < 1.5) {
			lines.push(
				`Bias correction: ${biasCorrection.toFixed(3)} m/s² — acceptable. Speed estimates carry some uncertainty; use for relative comparison.`
			);
		} else if (biasCorrection < 3.0) {
			lines.push(
				`Bias correction: ${biasCorrection.toFixed(3)} m/s² — high. Speed integration is unreliable. Treat speed values as directional indicators only.`
			);
		} else {
			lines.push(
				`Bias correction: ${biasCorrection.toFixed(3)} m/s² — outside acceptable range. Speed and power figures have been suppressed.`
			);
		}
	}

	if (!analyticsValid) {
		lines.push(
			'Firmware analytics were marked invalid for this run. Speed, power, and derived metrics are not shown.'
		);
	} else {
		if (blocksPower) lines.push('Power calculations are blocked by data quality constraints.');
		if (blocksSpeed)
			lines.push('Speed estimates are suppressed — bias correction exceeds reliable threshold.');
	}

	lines.push(
		'Reaction time and G-force are direct sensor measurements and are not affected by data quality flags.'
	);

	return lines;
}

// ─── Recommendations language ─────────────────────────────────────────────────

export interface RecommendationInput {
	title: string;
	body: string;
	priority: 'high' | 'medium' | 'low';
	watchFor?: string;
}

export function formatRecommendation(
	rec: RecommendationInput,
	level: ReportDetailLevel,
	index: number
): string[] {
	const lines: string[] = [];

	if (isSimple(level)) {
		// Simple: one clear action sentence, no priority labels
		lines.push(`${index + 1}. ${rec.body}`);
		if (rec.watchFor) lines.push(`   Next session: ${rec.watchFor}`);
	} else {
		// Coach: priority label + full context
		const priorityLabel =
			rec.priority === 'high' ? '⚠ Priority' : rec.priority === 'medium' ? '→' : '·';
		lines.push(`${priorityLabel} ${rec.title}`);
		lines.push(`   ${rec.body}`);
		if (rec.watchFor) lines.push(`   Watch for: ${rec.watchFor}`);
	}

	return lines;
}

// ─── Watch-for language ───────────────────────────────────────────────────────

export function watchForSection(watchItems: string[], level: ReportDetailLevel): string[] {
	if (watchItems.length === 0) return [];

	if (isSimple(level)) {
		return ['Next session, look out for:', ...watchItems.map((w, i) => `${i + 1}. ${w}`)];
	}

	return ['Indicators to monitor next session:', ...watchItems.map((w) => `• ${w}`)];
}

// ─── Progress trend language ──────────────────────────────────────────────────

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'unknown';

export interface TrendInput {
	metric: string;
	direction: TrendDirection;
	change?: number | null;
	unit?: string;
	confidence: 'low' | 'medium' | 'high';
}

export function trendSentence(input: TrendInput, level: ReportDetailLevel): string | null {
	const { metric, direction, change, unit, confidence } = input;

	if (direction === 'unknown') return null;

	const changeText =
		change !== null && change !== undefined && unit
			? ` (${change > 0 ? '+' : ''}${change.toFixed(change < 1 ? 3 : 1)}${unit})`
			: '';

	const confidenceNote = confidence === 'low' ? ' — early indication, more sessions needed' : '';

	if (isSimple(level)) {
		if (direction === 'improving') return `${metric} is getting better${changeText}.`;
		if (direction === 'stable') return `${metric} is holding steady.`;
		if (direction === 'declining')
			return `${metric} is getting worse${changeText} — worth paying attention to.`;
	} else {
		if (direction === 'improving') return `${metric}: improving${changeText}${confidenceNote}.`;
		if (direction === 'stable') return `${metric}: stable${confidenceNote}.`;
		if (direction === 'declining') return `${metric}: declining${changeText}${confidenceNote}.`;
	}

	return null;
}

export function conflictWarning(
	speedImproving: boolean,
	consistencyDeclining: boolean,
	fatigueWorsening: boolean,
	level: ReportDetailLevel
): string | null {
	if (speedImproving && consistencyDeclining) {
		if (isSimple(level)) {
			return 'Your top times are improving, but your reaction times are more variable between runs. Try to make the average run better rather than chasing the best one.';
		}
		return 'Speed improving while consistency declines — classic peak-chasing pattern. Recommend shifting focus to floor-raising: consistent execution at slightly reduced intensity.';
	}

	if (speedImproving && fatigueWorsening) {
		if (isSimple(level)) {
			return "You're going faster, but your quality is dropping off sooner in each session. Recovery between sessions may need attention.";
		}
		return 'Speed improving but optimal set length declining — training load may be outpacing recovery capacity. Monitor fatigue indicators carefully.';
	}

	return null;
}

// ─── Confidence and trust language ───────────────────────────────────────────

export function getConfidenceLabel(
	confidence: 'low' | 'medium' | 'moderate' | 'high' | undefined
): string {
	if (confidence === 'high') return 'High confidence';
	if (confidence === 'medium' || confidence === 'moderate') return 'Trends are emerging';
	if (confidence === 'low') return 'Early data — more sessions needed';
	return 'Trends are emerging'; // default
}

export function confidenceStatement(
	confidence: 'low' | 'medium' | 'high',
	sessionCount: number,
	level: ReportDetailLevel
): string {
	if (isSimple(level)) {
		if (confidence === 'high')
			return `Based on ${sessionCount} sessions — the patterns here are well established.`;
		if (confidence === 'medium')
			return `Based on ${sessionCount} sessions — the trends are becoming clear but more data will confirm them.`;
		return `Based on only ${sessionCount} session${sessionCount === 1 ? '' : 's'} — these are early signs, not firm conclusions.`;
	}

	if (confidence === 'high')
		return `High confidence (${sessionCount} sessions). Trend direction is statistically reliable.`;
	if (confidence === 'medium')
		return `Medium confidence (${sessionCount} sessions). Trend direction is probable but not yet statistically robust.`;
	return `Low confidence (${sessionCount} session${sessionCount === 1 ? '' : 's'}). Treat as indicative only — continue collecting data before acting on these patterns.`;
}

// ─── Executive summary builders ───────────────────────────────────────────────

export function sessionExecutiveSummary(params: {
	headline: string;
	qualityScore: number | null;
	bestVsAvgGap: number | null;
	dropOffRun: number | null;
	runCount: number;
	dataQualityLabel: string | null;
	level: ReportDetailLevel;
}): string[] {
	const {
		headline,
		qualityScore: q,
		bestVsAvgGap,
		dropOffRun,
		runCount,
		dataQualityLabel,
		level
	} = params;
	const lines: string[] = [];

	lines.push(headline);

	if (isSimple(level)) {
		if (q !== null) {
			if (q >= 75) lines.push('Overall this was a good, consistent session.');
			else if (q >= 55) lines.push('A mixed session — some good runs and some that need work.');
			else lines.push('A difficult session with a lot of variation between runs.');
		}
		if (dropOffRun !== null && dropOffRun < runCount) {
			lines.push(`The best runs came early. Quality started to drop around run ${dropOffRun}.`);
		}
	} else {
		if (q !== null) lines.push(`Session quality: ${q}/100.`);
		if (bestVsAvgGap !== null) lines.push(`Best-vs-average gap: ${bestVsAvgGap.toFixed(1)}%.`);
		if (dropOffRun !== null && dropOffRun < runCount)
			lines.push(`Drop-off detected at run ${dropOffRun} of ${runCount}.`);
		if (dataQualityLabel && dataQualityLabel !== 'Excellent') {
			lines.push(`Data quality: ${dataQualityLabel}. Some derived metrics may be limited.`);
		}
	}

	return lines;
}

export function progressExecutiveSummary(params: {
	headline: string;
	overallTrend: string;
	confidence: 'low' | 'medium' | 'high';
	sessionCount: number;
	warnings: string[];
	level: ReportDetailLevel;
}): string[] {
	const { headline, overallTrend, confidence, sessionCount, warnings, level } = params;
	const lines: string[] = [];

	lines.push(headline);
	lines.push(confidenceStatement(confidence, sessionCount, level));

	if (warnings.length > 0) {
		if (isSimple(level)) {
			lines.push(`Something to watch: ${warnings[0].toLowerCase()}`);
		} else {
			lines.push(`Flags: ${warnings.join('; ')}`);
		}
	}

	return lines;
}

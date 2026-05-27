import type {
    GeneratedReport,
    ProgressReportInput,
    ReportBuildOptions,
    ReportChart,
    ReportMetric,
    ReportDetailLevel,
    ProgressRecommendation,
} from './types';

import {
    compactLines,
    createRecommendation,
    createSection,
    formatNumber,
    formatPercent,
    reportId,
} from './reportSections';

import { isSimple, isCoach } from './reportLanguage';

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildProgressReport(
    input: ProgressReportInput,
    options: ReportBuildOptions = {}
): GeneratedReport {
    const detailLevel    = options.detailLevel    ?? 'standard';
    const includeCharts  = options.includeCharts  ?? true;
    const includeRecs    = options.includeRecommendations ?? true;
    const includeDiag    = options.includeDiagnostics ?? true;

    const report = input.crossSessionReport;

    // ── Headline ──────────────────────────────────────────────────────────────
    const headline = buildProgressHeadline(input, detailLevel);
    const confidence = report?.confidence as 'high' | 'medium' | 'low' | undefined;

    // ── Metrics ───────────────────────────────────────────────────────────────
    const metrics: ReportMetric[] = buildProgressMetrics(input);

    // ── Recommendations ───────────────────────────────────────────────────────
    const recommendations = includeRecs
        ? buildProgressRecommendations(input, detailLevel)
        : [];

    // ── Charts ────────────────────────────────────────────────────────────────
    const charts: ReportChart[] = includeCharts
        ? input.charts ?? defaultProgressCharts()
        : [];

    // ── Sections ──────────────────────────────────────────────────────────────

    // 1. Executive summary
    const execLines = buildProgressExecutiveSummary(input, detailLevel);
    const executiveSummarySection = createSection({
        id:       'executive-summary',
        type:     'executive-summary',
        title:    'Summary',
        priority: 'high',
        content:  execLines,
    });

    // 2. Key findings — what the trends actually mean
    const keyFindingsSection = createSection({
        id:       'key-findings',
        type:     'key-findings',
        title:    'Key Findings',
        priority: 'high',
        content:  buildKeyFindings(input, detailLevel),
    });

    // 3. Progress trends — the metric-by-metric story
    const trendsSection = createSection({
        id:       'progress-trends',
        type:     'progress-trends',
        title:    'Progress Trends',
        priority: 'high',
        content:  buildTrendNarrative(input, detailLevel),
        metrics,
    });

    // 4. Fatigue and set capacity
    const fatigueLines = buildFatigueNarrative(input, detailLevel);
    const fatigueSection = fatigueLines.length > 0 ? createSection({
        id:       'fatigue-analysis',
        type:     'session-quality',
        title:    'Training Capacity',
        priority: 'medium',
        content:  fatigueLines,
    }) : null;

    // 5. Watch-for — forward looking
    const watchLines = buildProgressWatchFor(input, detailLevel);
    const watchSection = watchLines.length > 0 ? createSection({
        id:       'watch-for',
        type:     'watch-for',
        title:    'Next Sessions',
        priority: 'medium',
        content:  watchLines,
    }) : null;

    // 6. Charts
    const chartsSection = includeCharts ? createSection({
        id:       'charts',
        type:     'charts',
        title:    'Visual Evidence',
        priority: 'medium',
        content:  ['The charts below show whether the patterns described above are stable, improving or fluctuating.'],
        charts,
    }) : null;

    // 7. Goal context — progress toward active goals
    const goalsSection = (() => {
        const goals = input.goalContext;
        if (!goals || goals.length === 0) return null;

        const lines: string[] = [];

        // Goals close to target (≥80%) — celebrate progress
        const nearTarget = goals.filter(g => (g.percentToGoal ?? 0) >= 80);
        // Goals with meaningful progress (20–79%)
        const inProgress = goals.filter(g => {
            const p = g.percentToGoal ?? 0;
            return p >= 20 && p < 80;
        });
        // Goals just started or stalled (<20%)
        const earlyStage = goals.filter(g => (g.percentToGoal ?? 0) < 20);

        if (nearTarget.length > 0) {
            nearTarget.forEach(g => {
                lines.push(
                    `${g.metric} goal — ${g.percentToGoal}% of the way to target. ` +
                    `Current: ${g.currentValue !== null ? g.currentValue.toFixed(3) : '—'}, Target: ${g.targetValue.toFixed(3)}.`
                );
            });
        }

        if (inProgress.length > 0) {
            inProgress.forEach(g => {
                lines.push(
                    `${g.metric} — ${g.percentToGoal}% progress toward target ` +
                    `(${g.currentValue !== null ? g.currentValue.toFixed(3) : '—'} → ${g.targetValue.toFixed(3)}).`
                );
            });
        }

        if (earlyStage.length > 0 && detailLevel !== 'simple') {
            earlyStage.forEach(g => {
                lines.push(
                    `${g.metric} goal set — ${g.percentToGoal ?? 0}% progress so far.`
                );
            });
        }

        if (lines.length === 0) return null;

        return createSection({
            id:       'goal-progress',
            type:     'key-findings',
            title:    nearTarget.length > 0 ? 'Goals — Close to Target' : 'Active Goals',
            priority: 'high',
            content:  lines,
        });
    })();

    // 8. Data quality / confidence
    const confidenceSection = includeDiag ? createSection({
        id:       'data-quality',
        type:     'data-quality',
        title:    'Confidence Note',
        priority: 'low',
        content:  buildConfidenceNote(input, detailLevel),
    }) : null;

    const sections = [
        executiveSummarySection,
        goalsSection,
        keyFindingsSection,
        trendsSection,
        fatigueSection,
        watchSection,
        chartsSection,
        confidenceSection,
    ].filter((s): s is NonNullable<typeof s> => s !== null);

    // ── Assemble ──────────────────────────────────────────────────────────────
    return {
        id:          reportId('progress-report'),
        type:        'progress',
        title:       'Progress Report',
        subtitle:    input.dateRange,
        generatedAt: new Date().toISOString(),
        detailLevel,
        subject: {
            riderName:    input.riderName,
            dateRange:    input.dateRange,
            sessionCount: input.sessionCount,
        },
        summary: {
            headline,
            confidence,
            body: compactLines([
                buildOneLinerSummary(input),
                recommendations[0]?.body ?? null,
            ]),
        },
        sections,
        charts,
        recommendations,
    };
}

// ─── Headline ─────────────────────────────────────────────────────────────────

function buildProgressHeadline(input: ProgressReportInput, level: ReportDetailLevel): string {
    const report  = input.crossSessionReport;
    const trend   = report?.overallTrend?.toLowerCase() ?? '';
    const session = input.sessionCount;

    if (session < 3) return 'Early days — keep building the picture.';

    if (trend.includes('improving') || trend.includes('positive')) {
        return 'Performance is improving — the work is paying off.';
    }
    if (trend.includes('declining') || trend.includes('negative')) {
        return 'Some metrics are declining — worth investigating why.';
    }
    if (trend.includes('mixed')) {
        return 'Mixed picture — some areas improving, some needing attention.';
    }
    if (trend.includes('steady') || trend.includes('stable')) {
        return 'Performance holding steady — maintain current approach.';
    }

    return 'Progress report across ' + session + ' sessions.';
}

// ─── One-liner for summary body ───────────────────────────────────────────────

function buildOneLinerSummary(input: ProgressReportInput): string | null {
    const report = input.crossSessionReport;
    if (!report) return null;

    const parts: string[] = [];

    const rxChange = report.performance?.reactionTrend?.change;
    if (rxChange !== null && rxChange !== undefined) {
        const dir = rxChange < 0 ? 'improved' : 'slowed';
        parts.push(`Reaction time ${dir} ${Math.abs(rxChange * 1000).toFixed(0)}ms`);
    }

    const spdChange = report.performance?.speedTrend?.change;
    if (spdChange !== null && spdChange !== undefined) {
        const dir = spdChange > 0 ? 'up' : 'down';
        parts.push(`speed ${dir} ${Math.abs(spdChange).toFixed(1)} km/h`);
    }

    if (parts.length === 0) return report.recommendations?.[0] ?? null;
    return parts.join(', ') + ' across the analysis period.';
}

// ─── Executive summary lines ──────────────────────────────────────────────────

function buildProgressExecutiveSummary(input: ProgressReportInput, level: ReportDetailLevel): string[] {
    const report  = input.crossSessionReport;
    const session = input.sessionCount;
    const lines:  string[] = [];

    // Opening context
    if (isSimple(level)) {
        lines.push(`This report covers ${session} training session${session === 1 ? '' : 's'}.`);
    } else {
        lines.push(`Analysis across ${session} session${session === 1 ? '' : 's'}${input.dateRange ? ` (${input.dateRange})` : ''}.`);
    }

    // Reaction trend
    const rxChange = report?.performance?.reactionTrend?.change;
    const rxDir    = report?.performance?.reactionTrend?.direction;
    if (rxChange !== null && rxChange !== undefined && rxDir) {
        const ms = Math.abs(rxChange * 1000).toFixed(0);
        if (isSimple(level)) {
            lines.push(rxChange < 0
                ? `Reaction times are getting quicker — down ${ms}ms on average.`
                : `Reaction times have slowed slightly — up ${ms}ms on average.`
            );
        } else {
            lines.push(`Reaction time: ${rxDir} (${rxChange < 0 ? '−' : '+'}${ms}ms across recent sessions).`);
        }
    }

    // Speed trend
    const spdChange = report?.performance?.speedTrend?.change;
    if (spdChange !== null && spdChange !== undefined) {
        const kmh = Math.abs(spdChange).toFixed(1);
        if (isSimple(level)) {
            lines.push(spdChange > 0
                ? `Peak speed is up ${kmh} km/h — good sign.`
                : `Peak speed is down ${kmh} km/h — worth watching.`
            );
        } else {
            lines.push(`Peak speed: ${spdChange > 0 ? '+' : '−'}${kmh} km/h trend (IMU estimated — directional only).`);
        }
    }

    // Watch-outs
    const warnings = report?.warnings ?? [];
    if (warnings.length > 0 && isCoach(level)) {
        lines.push(`Watch-outs: ${warnings.slice(0, 2).join('; ')}.`);
    }

    return compactLines(lines);
}

// ─── Key findings ─────────────────────────────────────────────────────────────

function buildKeyFindings(input: ProgressReportInput, level: ReportDetailLevel): string[] {
    const report = input.crossSessionReport;
    const lines: string[] = [];

    if (!report) {
        return ['Not enough sessions yet to identify clear patterns. Keep training and uploading.'];
    }

    // Consistency
    const consistencyDir = report.consistency?.repeatabilityTrend?.direction;
    if (consistencyDir) {
        const improving = consistencyDir.toLowerCase().includes('improv');
        lines.push(`✓ Consistency` );
        lines.push(`   ${improving
            ? 'Starts are becoming more repeatable — good sign for race-day performance.'
            : 'Consistency is variable — the gap between best and average runs needs attention.'}`
        );
    }

    // Fatigue
    const fatigueDir = report.fatigue?.optimalSetLengthTrend?.direction;
    if (fatigueDir) {
        const improving = fatigueDir.toLowerCase().includes('improv') ||
                          fatigueDir.toLowerCase().includes('longer');
        lines.push(improving ? `✓ Fatigue resistance` : `⚠ Fatigue`);
        lines.push(`   ${improving
            ? 'Able to sustain quality for more runs before dropping off — fitness improving.'
            : 'Drop-off is appearing earlier in sets — fatigue or load management needs attention.'}`
        );
    }

    // Overall trend
    const overallTrend = report.overallTrend?.toLowerCase() ?? '';
    if (overallTrend.includes('mixed')) {
        lines.push(`→ Mixed signals`);
        lines.push(`   Some metrics are improving while others are declining. Don't push harder — investigate which training variables are changing.`);
    } else if (overallTrend.includes('declining')) {
        lines.push(`⚠ Multiple metrics declining`);
        lines.push(`   Consider recovery, training load, or technique check. Don't push harder when metrics are going the wrong way.`);
    }

    // Recommended focus from cross-session engine
    const topRec = report.recommendations?.[0];
    if (topRec && isCoach(level)) {
        lines.push(`→ Priority focus`);
        lines.push(`   ${topRec}`);
    }

    return compactLines(lines);
}

// ─── Trend narrative ──────────────────────────────────────────────────────────

function buildTrendNarrative(input: ProgressReportInput, level: ReportDetailLevel): string[] {
    const report = input.crossSessionReport;
    const lines: string[] = [];

    if (!report) return ['Insufficient data for trend analysis — 3+ sessions required.'];

    // Reaction time
    const rxTrend  = report.performance?.reactionTrend;
    const rxChange = rxTrend?.change;
    if (rxChange !== null && rxChange !== undefined) {
        const ms  = Math.abs(rxChange * 1000).toFixed(0);
        const pct = input.reactionTrendPercent;
        if (isSimple(level)) {
            lines.push(rxChange < 0
                ? `Your reaction times are getting quicker. That's the most important number here.`
                : `Reaction times have edged up slightly. Focus on the pre-gate routine.`
            );
        } else {
            lines.push(`Reaction time ${rxChange < 0 ? 'improving' : 'declining'} — ${rxChange < 0 ? '−' : '+'}${ms}ms${pct !== null && pct !== undefined ? ` (${Math.abs(pct).toFixed(1)}% ${rxChange < 0 ? 'faster' : 'slower'})` : ''}.`);
            if (isCoach(level) && rxChange > 0) {
                lines.push(`A rising reaction time trend often signals fatigue, inconsistent pre-gate routine, or increased training load. Check whether other metrics are also declining.`);
            }
        }
    }

    // Speed
    const spdTrend  = report.performance?.speedTrend;
    const spdChange = spdTrend?.change;
    if (spdChange !== null && spdChange !== undefined) {
        const kmh = Math.abs(spdChange).toFixed(1);
        if (isSimple(level)) {
            lines.push(spdChange > 0
                ? `Speed is up — good progress.`
                : `Speed is slightly down. Speed estimates from IMU aren't exact, so small changes may just be variation.`
            );
        } else {
            lines.push(`Peak speed ${spdChange > 0 ? 'trending up' : 'trending down'} ${spdChange > 0 ? '+' : '−'}${kmh} km/h. Note: IMU-estimated speed is directional — treat small changes cautiously.`);
        }
    }

    // Consistency / best vs average gap
    const gapTrend = report.consistency?.bestVsAverageGapTrend;
    if (gapTrend?.direction) {
        const tightening = gapTrend.direction.toLowerCase().includes('improv') ||
                           gapTrend.direction.toLowerCase().includes('tighten') ||
                           gapTrend.direction.toLowerCase().includes('declin'); // declining gap = improving
        if (isSimple(level)) {
            lines.push(tightening
                ? `The gap between your best and average run is getting smaller — that means more consistent starts.`
                : `The gap between best and average is widening — peak runs are good but consistency needs work.`
            );
        } else {
            lines.push(`Best vs average gap ${tightening ? 'tightening' : 'widening'} — ${tightening ? 'consistency is improving' : 'floor-raising should be the focus, not peak chasing'}.`);
        }
    }

    return compactLines(lines);
}

// ─── Fatigue narrative ────────────────────────────────────────────────────────

function buildFatigueNarrative(input: ProgressReportInput, level: ReportDetailLevel): string[] {
    const report = input.crossSessionReport;
    const lines: string[] = [];

    if (!report?.fatigue) return [];

    const setLengthDir = report.fatigue.optimalSetLengthTrend?.direction;
    const dropOffDir   = report.fatigue.dropOffTrend?.direction;

    if (!setLengthDir && !dropOffDir) return [];

    if (isSimple(level)) {
        if (setLengthDir?.toLowerCase().includes('up') ||
            setLengthDir?.toLowerCase().includes('longer') ||
            setLengthDir?.toLowerCase().includes('increas') ||
            setLengthDir?.toLowerCase().includes('improv')) {
            lines.push(`You're able to do more quality runs in a row before getting tired — fitness is building.`);
        } else if (setLengthDir) {
            lines.push(`The number of quality runs before fatigue sets in has been shorter recently. Shorter sets with full recovery between them might help.`);
        }
    } else {
        if (setLengthDir) {
            const improving = setLengthDir.toLowerCase().includes('up') ||
                             setLengthDir.toLowerCase().includes('longer') ||
                             setLengthDir.toLowerCase().includes('increas') ||
                             setLengthDir.toLowerCase().includes('improv');
            lines.push(`Optimal set length trend: ${setLengthDir}. ${
                improving
                    ? 'Fatigue resistance is building — progressive overload is working.'
                    : 'Consider reducing set length and increasing recovery time between sets.'
            }`);
        }
        if (dropOffDir && isCoach(level)) {
            const improving = dropOffDir.toLowerCase().includes('up') ||
                             dropOffDir.toLowerCase().includes('later') ||
                             dropOffDir.toLowerCase().includes('increas') ||
                             dropOffDir.toLowerCase().includes('improv');
            lines.push(`Drop-off position trend: ${dropOffDir}. ${
                improving
                    ? 'Drop-off is occurring later in sets — a positive indicator of improving fatigue resistance.'
                    : 'Performance is deteriorating earlier in sets — a sign of accumulated fatigue or inadequate recovery.'
            }`);
        }
    }

    return compactLines(lines);
}

// ─── Watch-for ────────────────────────────────────────────────────────────────

function buildProgressWatchFor(input: ProgressReportInput, level: ReportDetailLevel): string[] {
    const report = input.crossSessionReport;
    const lines: string[] = [];

    if (!report) return [];

    // From cross-session watch-outs
    const warnings = (report.warnings ?? [])
        .filter((w: string) => w && w.trim().length > 20)
        .slice(0, 2);

    if (isSimple(level)) {
        if (warnings.length > 0) {
            lines.push(`In your next few sessions, keep an eye on whether the patterns here continue or change.`);
        }
        // Simple specific watch-fors
        const rxChange = report.performance?.reactionTrend?.change;
        if (rxChange !== null && rxChange !== undefined && rxChange > 0) {
            lines.push(`Whether your reaction times stabilise or keep rising`);
        }
    } else {
        // Coach-level specific observations
        warnings.forEach((w: string) => lines.push(w));

        const rxChange = report.performance?.reactionTrend?.change;
        if (rxChange !== null && rxChange !== undefined && rxChange > 0) {
            lines.push(`Reaction time trend — if it continues rising, consider training load, sleep, and pre-gate routine`);
        }

        const spdChange = report.performance?.speedTrend?.change;
        if (spdChange !== null && spdChange !== undefined && spdChange < -1) {
            lines.push(`Speed trend — down ${Math.abs(spdChange).toFixed(1)} km/h overall, but check whether individual sessions show variation or a consistent decline`);
        }

        if (input.sessionCount < 10) {
            lines.push(`Confidence will increase with more sessions — ${10 - input.sessionCount} more needed for full rolling analytics`);
        }
    }

    return compactLines(lines.filter(l => l.trim().length > 20));
}

// ─── Confidence note ──────────────────────────────────────────────────────────

function buildConfidenceNote(input: ProgressReportInput, level: ReportDetailLevel): string[] {
    const lines: string[] = [];
    const session = input.sessionCount;
    const conf    = input.crossSessionReport?.confidence ?? 'medium';

    if (isSimple(level)) {
        lines.push(`This report is based on ${session} sessions. The more sessions you upload, the more reliable the patterns become.`);
    } else {
        lines.push(`Confidence: ${conf}. Based on ${session} session${session === 1 ? '' : 's'}.`);
        if (session < 10) {
            lines.push(`Full rolling analytics unlock at 10 sessions (${10 - session} more needed). Trends identified now may shift as more data arrives.`);
        }
        if (session >= 10) {
            lines.push(`Speed values are IMU estimates — directional trends are meaningful but absolute values should be treated with caution.`);
        }
        lines.push(`Reaction time and G-force are direct measurements and are not affected by estimation uncertainty.`);
    }

    return compactLines(lines);
}

// ─── Progress metrics ─────────────────────────────────────────────────────────

function buildProgressMetrics(input: ProgressReportInput): ReportMetric[] {
    const report  = input.crossSessionReport;
    const metrics: ReportMetric[] = [];

    metrics.push({
        label: 'Sessions analysed',
        value: String(input.sessionCount),
    });

    const rxChange = report?.performance?.reactionTrend?.change;
    if (rxChange !== null && rxChange !== undefined) {
        const ms = Math.abs(rxChange * 1000).toFixed(0);
        metrics.push({
            label:  'Reaction trend',
            value:  `${rxChange < 0 ? '−' : '+'}${ms}`,
            unit:   'ms',
            rating: rxChange < 0 ? 'Improving' : 'Declining',
        });
    }

    const spdChange = report?.performance?.speedTrend?.change;
    if (spdChange !== null && spdChange !== undefined) {
        metrics.push({
            label:  'Speed trend',
            value:  `${spdChange > 0 ? '+' : '−'}${Math.abs(spdChange).toFixed(1)}`,
            unit:   'km/h',
            rating: spdChange > 0 ? 'Improving' : 'Declining',
            note:   'IMU estimated',
        });
    }

    if (report?.overallTrend) {
        metrics.push({
            label: 'Overall direction',
            value: report.overallTrend,
        });
    }

    if (report?.confidence) {
        metrics.push({
            label: 'Confidence',
            value: report.confidence,
        });
    }

    // Personal bests if available
    if (input.personalBests?.bestReactionMs) {
        metrics.push({
            label: 'Best reaction ever',
            value: (input.personalBests.bestReactionMs / 1000).toFixed(3),
            unit:  's',
        });
    }

    return metrics;
}

// ─── Recommendations ─────────────────────────────────────────────────────────

function buildProgressRecommendations(
    input: ProgressReportInput,
    level: ReportDetailLevel
) {
    const rawRecs = input.recommendations ??
                    input.crossSessionReport?.recommendations ??
                    [];

    if (Array.isArray(rawRecs) && rawRecs.length > 0) {
        return rawRecs
            .filter(r => r && String(r).trim().length > 0)
            .slice(0, 5)
            .map((rec, i) => {
                if (typeof rec === 'object' && rec !== null && 'title' in rec) {
                    const typedRec = rec as ProgressRecommendation;
                    return createRecommendation({
                        id:       `progress-rec-${i + 1}`,
                        priority: typedRec.priority ?? (i === 0 ? 'high' : 'medium'),
                        title:    typedRec.title,
                        body:     typedRec.body ?? typedRec.message ?? String(rec),
                        watchFor: typedRec.watchFor,
                    });
                }
                return createRecommendation({
                    id:       `progress-rec-${i + 1}`,
                    priority: i === 0 ? 'high' : 'medium',
                    title:    `Focus ${i + 1}`,
                    body:     String(rec),
                });
            });
    }

    return [
        createRecommendation({
            id:       'progress-rec-default',
            priority: 'medium',
            title:    'Keep building the picture',
            body:     'Continue uploading comparable sessions. Trend confidence increases significantly between 5 and 10 sessions.',
            watchFor: 'Whether the patterns identified here remain consistent or shift with more data.',
        }),
    ];
}

// ─── Default charts ───────────────────────────────────────────────────────────

function defaultProgressCharts(): ReportChart[] {
    return [
        // Core performance trends
        {
            id:               'reaction-time-trend',
            title:            'Reaction Time Trend',
            description:      'Best and average reaction times across all sessions — lower is better.',
            chartType:        'line',
            dataKey:          'reactionTimeTrend',
            includeByDefault: true,
        },
        {
            id:               'best-vs-average-gap-trend',
            title:            'Best vs Average Gap',
            description:      'Shows whether peak performance is becoming more repeatable. Smaller gap = better consistency.',
            chartType:        'line',
            dataKey:          'bestVsAverageGapTrend',
            includeByDefault: true,
        },
        
        // Performance Engine Analytics
        {
            id:               'technique-quality-trend',
            title:            'Technique Consistency Over Time',
            description:      'How repeatably you execute starts across sessions. Higher scores indicate more consistent technique.',
            chartType:        'line',
            dataKey:          'techniqueQualityTrend',
            includeByDefault: true,
        },
        {
            id:               'power-output-trend',
            title:            'Power Development',
            description:      'Estimated peak power output showing strength progression. Calculated from G-force × body mass.',
            chartType:        'line',
            dataKey:          'powerOutputTrend',
            includeByDefault: true,
        },
        {
            id:               'smoothness-trend',
            title:            'Force Application Smoothness',
            description:      'How cleanly power is applied through the start. Smoother = more efficient technique.',
            chartType:        'line',
            dataKey:          'smoothnessTrend',
            includeByDefault: true,
        },
        {
            id:               'data-quality-trend',
            title:            'Sensor Data Quality',
            description:      'Calibration stability across sessions. Shows reliability of measurements.',
            chartType:        'bar',
            dataKey:          'dataQualityTrend',
            includeByDefault: false,
        },
        {
            id:               'wheelie-pattern-analysis',
            title:            'Wheelie Patterns & Impact',
            description:      'Wheelie frequency and correlation with reaction time performance.',
            chartType:        'bar',
            dataKey:          'wheeliePatternTrend',
            includeByDefault: false,
        },
        
        // Fatigue analysis
        {
            id:               'optimal-set-length-trend',
            title:            'Optimal Set Length',
            description:      'How many quality runs per session before fatigue sets in.',
            chartType:        'bar',
            dataKey:          'optimalSetLengthTrend',
            includeByDefault: true,
        },
        {
            id:               'drop-off-position-trend',
            title:            'Drop-Off Position',
            description:      'Where performance deteriorates within a session — later is better.',
            chartType:        'line',
            dataKey:          'dropOffPositionTrend',
            includeByDefault: false,
        },
    ];
}
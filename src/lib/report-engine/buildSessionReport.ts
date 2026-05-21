import type {
    CoachSessionReportInput,
    GeneratedReport,
    ReportBuildOptions,
    ReportChart,
    ReportMetric,
    ReportRecommendation,
} from './types';

import {
    compactLines,
    createRecommendation,
    createSection,
    formatNumber,
    formatPercent,
    reportId,
} from './reportSections';

import {
    sessionQualityHeadline,
    sessionQualitySummary,
    repeatabilitySection,
    techniqueSection,
    dataQualitySection,
    formatRecommendation,
    watchForSection,
    sessionExecutiveSummary,
    conflictWarning,
    type SessionQualityInput,
    type RepeatabilityInput,
    type TechniqueInput,
    type DataQualityInput,
    type RecommendationInput,
} from './reportLanguage';

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildCoachSessionReport(
    input: CoachSessionReportInput,
    options: ReportBuildOptions = {}
): GeneratedReport {
    const detailLevel    = options.detailLevel           ?? 'coach';
    const includeCharts  = options.includeCharts         ?? true;
    const includeRecs    = options.includeRecommendations ?? true;
    const includeDiag    = options.includeDiagnostics    ?? true;

    const sessionReport  = input.sessionReport;
    const narrative      = input.sessionNarrative;
    const dataQuality    = input.dataQuality;
    const technique      = input.techniqueSummary;

    // Session context — affects how we frame findings
    const isTesting      = input.sessionFocus === 'testing' || input.sessionFocus === 'technique';
    const isWetSurface   = input.trackSurface === 'wet' || input.trackSurface === 'muddy';
    const excludedRuns   = input.excludedRunCount ?? narrative?.trust?.excludedRuns ?? 0;
    const excludedReasons = input.excludedReasons ?? narrative?.trust?.excludedReasons ?? [];

    // ── Headline ──────────────────────────────────────────────────────────────

    const headline = sessionQualityHeadline({
        sessionQuality:   sessionReport?.sessionQuality   ?? null,
        repeatability:    sessionReport?.repeatability?.overall ?? null,
        bestVsAvgGap:     sessionReport?.bestVsAvg?.gapPercent  ?? null,
        optimalSetLength: sessionReport?.setLength?.optimal      ?? null,
        dropOffRun:       sessionReport?.dropOff?.dropOffRun     ?? null,
        runCount:         input.runCount,
    });

    // Prefer the narrative headline when it was produced by buildSessionNarrative,
    // identified by the isCoachingHeadline flag on CoachMessage. Fall back to the
    // sessionQualityHeadline generated above when the narrative is absent or was
    // constructed ad-hoc (e.g. in tests or report preview code that builds a
    // CoachMessage directly without going through buildSessionNarrative).
    // The old approach checked for the absence of the word "view" in the string,
    // which was fragile and would silently break if a coaching headline ever
    // legitimately contained that word.
    const narrativeHeadline = narrative?.message?.headline;
    const headlineIsCoaching = narrative?.message?.isCoachingHeadline === true;

    // Final headline: use narrative if it carries the coaching flag, otherwise use generated
    const finalHeadline = headlineIsCoaching && narrativeHeadline ? narrativeHeadline : headline;

    const confidence =
        narrative?.trust?.confidence ??
        sessionReport?.confidence ??
        undefined;

    // ── Conflict check ────────────────────────────────────────────────────────
    // Detect when positive and negative signals co-exist so the report
    // doesn't give a falsely positive summary.

    const speedImproving      = false; // session-level: not applicable
    const consistencyBad      = sessionReport?.repeatability?.overall !== undefined &&
                                sessionReport.repeatability.overall < 50;
    const fatigueDetected     = sessionReport?.dropOff?.dropOffRun !== undefined &&
                                sessionReport.dropOff.dropOffRun <= Math.ceil(input.runCount * 0.5);

    const conflict = conflictWarning(speedImproving, consistencyBad, fatigueDetected, detailLevel);

    // ── Metrics table ─────────────────────────────────────────────────────────

    const metrics: ReportMetric[] = [
        {
            label: 'Session quality',
            value: formatNumber(sessionReport?.sessionQuality, 0),
            unit: '/100',
            note: sessionReport?.sessionQuality !== undefined
                ? sessionReport.sessionQuality >= 70 ? 'Good' : sessionReport.sessionQuality >= 50 ? 'Fair' : 'Variable'
                : undefined,
        },
        {
            label: 'Repeatability',
            value: formatNumber(sessionReport?.repeatability?.overall, 0),
            unit: '/100',
            note: sessionReport?.repeatability?.cvPercent !== undefined
                ? sessionReport.repeatability.cvPercent < 5  ? 'Excellent'
                : sessionReport.repeatability.cvPercent < 10 ? 'Good'
                : sessionReport.repeatability.cvPercent < 15 ? 'Moderate'
                : 'Variable'
                : undefined,
        },
        {
            label: 'Best vs average gap',
            value: formatPercent(sessionReport?.bestVsAvg?.gapPercent),
            note: sessionReport?.bestVsAvg?.gapPercent !== undefined
                ? sessionReport.bestVsAvg.gapPercent < 5 ? 'Excellent' : sessionReport.bestVsAvg.gapPercent < 12 ? 'Moderate' : 'Wide'
                : undefined,
        },
        {
            label: 'Optimal set length',
            value: sessionReport?.setLength?.optimal ?? '—',
            unit: typeof sessionReport?.setLength?.optimal === 'number' ? 'runs' : undefined,
        },
        {
            label: 'Drop-off run',
            value: sessionReport?.dropOff?.dropOffRun ?? 'None detected',
        },
        {
            label: 'Data quality',
            value: dataQuality?.label ?? dataQuality?.rating ?? 'Unknown',
        },
    ];

    // ── Recommendations ───────────────────────────────────────────────────────

    const recommendations = includeRecs
        ? buildSessionRecommendations(input, detailLevel)
        : [];

    // ── Charts ────────────────────────────────────────────────────────────────

    const charts: ReportChart[] = includeCharts
        ? input.charts ?? defaultSessionCharts()
        : [];

    // ── Sections ──────────────────────────────────────────────────────────────

    const qualityInput: SessionQualityInput = {
        sessionQuality:   sessionReport?.sessionQuality   ?? null,
        repeatability:    sessionReport?.repeatability?.overall ?? null,
        bestVsAvgGap:     sessionReport?.bestVsAvg?.gapPercent  ?? null,
        optimalSetLength: sessionReport?.setLength?.optimal      ?? null,
        dropOffRun:       sessionReport?.dropOff?.dropOffRun     ?? null,
        runCount:         input.runCount,
    };

    const repeatInput: RepeatabilityInput = {
        score:     sessionReport?.repeatability?.overall ?? null,
        cvPercent: sessionReport?.repeatability?.cvPercent ?? null,
        label:     sessionReport?.repeatability?.label ?? null,
    };

    const techniqueInput: TechniqueInput = {
        overall:       technique?.overall       ?? null,
        reaction:      technique?.reaction      ?? null,
        explosiveness: technique?.explosiveness ?? null,
        smoothness:    technique?.smoothness    ?? null,
        efficiency:    technique?.efficiency    ?? null,
        riderLevel:    input.riderLevel         ?? null,
    };

    const dqInput: DataQualityInput = {
        label:          dataQuality?.label          ?? null,
        biasCorrection: dataQuality?.biasCorrection ?? null,
        analyticsValid: dataQuality?.analyticsValid ?? true,
        blocksPower:    dataQuality?.blocksPower    ?? false,
        blocksSpeed:    dataQuality?.blocksSpeed    ?? dataQuality?.blocksDistanceConfidence ?? false,
    };

    // Surface caution metrics from trust context into data quality section
    const cautionMetrics = narrative?.trust?.cautionMetrics ?? [];
    const blockedMetrics = narrative?.trust?.blockedMetrics ?? [];

    // ── Executive summary (using analysis view coaching language) ────────────
    const execLines = sessionExecutiveSummary({
        headline:         finalHeadline,
        qualityScore:     sessionReport?.sessionQuality ?? null,
        bestVsAvgGap:     sessionReport?.bestVsAvg?.gapPercent ?? null,
        dropOffRun:       sessionReport?.dropOff?.dropOffRun ?? null,
        runCount:         input.runCount,
        dataQualityLabel: dataQuality?.label ?? null,
        level:            detailLevel,
    });

    // Add narrative impact and why-this-matters from analysis view
    // Filter out UI descriptions that shouldn't appear in coaching reports
    if (narrative?.message?.impact && 
        !narrative.message.impact.toLowerCase().includes('view') &&
        !narrative.message.impact.toLowerCase().includes('same data as') &&
        !execLines.includes(narrative.message.impact)) {
        execLines.push(narrative.message.impact);
    }
    if (narrative?.message?.whyThisMatters) {
        execLines.push(narrative.message.whyThisMatters);
    }

    // Context notes from v8.4 narrative (rideFeel dissonance, focus alignment,
    // conditions, correlation hints). These are pre-assembled by buildSessionNarrative
    // so the report doesn't need to re-derive them — just include them.
    if (narrative?.contextNotes && narrative.contextNotes.length > 0) {
        for (const note of narrative.contextNotes) {
            if (!execLines.includes(note)) execLines.push(note);
        }
    }

    // Session context notes — these qualify the findings before the reader
    // draws any conclusions. A testing session's consistency numbers mean
    // something different from a normal session's.
    if (isTesting) {
        execLines.push(
            `Context: this was logged as a ${input.sessionFocus} session. ` +
            `Variability in consistency and repeatability is expected — the rider was deliberately introducing change. ` +
            `Compare against a standard session before drawing conclusions.`
        );
    }

    if (isWetSurface) {
        execLines.push(
            `Surface: ${input.trackSurface}. Speed and explosiveness metrics should be compared against other ${input.trackSurface} sessions only — ` +
            `traction conditions affect these outputs independently of technique.`
        );
    }

    // Evidence basis — how many runs the analysis is based on
    if (excludedRuns > 0) {
        const totalRuns = input.runCount + excludedRuns;
        const reasonText = excludedReasons.length > 0
            ? ` (${[...new Set(excludedReasons)].join(', ')})`
            : '';
        execLines.push(
            `Analysis based on ${input.runCount} of ${totalRuns} runs — ${excludedRuns} excluded${reasonText}.`
        );
    }

    // Conflict check
    if (conflict) {
        execLines.push(conflict);
    }

    const executiveSummarySection = createSection({
        id:       'executive-summary',
        type:     'executive-summary',
        title:    'Summary',
        priority: 'high',
        content:  execLines,
    });

    // ── Key findings — from analysis view insights ────────────────────────────
    const insightLines: string[] = [];
    const narrativeInsights = narrative?.insights ?? [];

    if (narrativeInsights.length > 0) {
        for (const insight of narrativeInsights) {
            // Format differently by detail level
            if (detailLevel === 'simple') {
                // Simple: just the body, no title prefix
                insightLines.push(insight.body);
            } else {
                // Coach: title + body with tone indicator
                const tonePrefix =
                    insight.tone === 'warning'  ? '⚠' :
                    insight.tone === 'positive' ? '✓' : '→';
                insightLines.push(`${tonePrefix} ${insight.title}`);
                insightLines.push(`   ${insight.body}`);
            }
        }
    } else {
        // Fallback: derive key findings from what we have
        const findings: string[] = [];

        if (sessionReport?.bestVsAvg?.gapPercent !== null && sessionReport?.bestVsAvg?.gapPercent !== undefined) {
            const gap = sessionReport.bestVsAvg.gapPercent;
            if (gap < 5) {
                findings.push('Best and average runs are very close — consistent execution throughout.');
            } else if (gap < 12) {
                findings.push(`${gap.toFixed(0)}% gap between best and average run — some variation across the session.`);
            } else {
                findings.push(`${gap.toFixed(0)}% gap between best and average — performance is not yet consistent.`);
            }
        }

        if (sessionReport?.dropOff?.dropOffRun !== null && sessionReport?.dropOff?.dropOffRun !== undefined) {
            findings.push(`Performance started to drop off at run ${sessionReport.dropOff.dropOffRun}.`);
        }

        if (sessionReport?.setLength?.optimal !== null && sessionReport?.setLength?.optimal !== undefined) {
            const optimal = sessionReport.setLength.optimal;
            if (optimal < input.runCount) {
                findings.push(`Quality held for approximately ${optimal} run${optimal === 1 ? '' : 's'} before declining.`);
            } else {
                findings.push('Quality held across all runs in the session.');
            }
        }

        if (sessionReport?.phaseAnalysis) {
            const p = sessionReport.phaseAnalysis;
            if (p.driveEfficiency < 50) {
                findings.push('Drive phase efficiency is low — the initial force application needs work.');
            } else if (p.driveEfficiency >= 75) {
                findings.push('Drive phase efficiency is strong — initial force application is well-timed.');
            }
        }

        insightLines.push(...findings);
    }

    const keyFindingsSection = createSection({
        id:       'key-findings',
        type:     'key-findings',
        title:    'Key Findings',
        priority: 'high',
        content:  insightLines.length > 0
            ? insightLines
            : ['Session analysis complete. Upload more sessions to identify patterns over time.'],
    });

    // ── Cross-run analysis section ────────────────────────────────────────────
    const crossRunLines: string[] = [];

    if (sessionReport?.bestVsAvg?.gapPercent !== null && sessionReport?.bestVsAvg?.gapPercent !== undefined) {
        const gap = sessionReport.bestVsAvg.gapPercent;
        if (detailLevel === 'simple') {
            crossRunLines.push(
                gap < 5   ? 'Your best run and your average run were very close — that\'s consistent execution.' :
                gap < 12  ? `Your best run was about ${gap.toFixed(0)}% better than your average.` :
                            `There\'s a ${gap.toFixed(0)}% gap between your best and average run. Work on making the average better, not just the best.`
            );
        } else {
            crossRunLines.push(`Best vs average gap: ${gap.toFixed(1)}% — ${gap < 5 ? 'excellent consistency' : gap < 12 ? 'moderate variation' : 'significant variation, focus on floor-raising'}.`);
        }
    }

    if (sessionReport?.dropOff?.dropOffRun !== null && sessionReport?.dropOff?.dropOffRun !== undefined) {
        const run = sessionReport.dropOff.dropOffRun;
        crossRunLines.push(
            detailLevel === 'simple'
                ? `Your starts were strongest in the first ${run - 1} run${run - 1 === 1 ? '' : 's'}. After that, quality started to drop.`
                : `Drop-off detected at run ${run}. Consider ending sets at run ${Math.max(1, run - 1)} to preserve quality.`
        );
    }

    if (sessionReport?.setLength?.optimal !== null && sessionReport?.setLength?.optimal !== undefined) {
        const optimal = sessionReport.setLength.optimal;
        if (optimal < input.runCount) {
            crossRunLines.push(
                detailLevel === 'simple'
                    ? `You got the most from your first ${optimal} run${optimal === 1 ? '' : 's'}.`
                    : `Optimal set length: ${optimal} run${optimal === 1 ? '' : 's'}. Quality begins to deteriorate beyond this point.`
            );
        }
    }

    // Phase analysis if available
    if (sessionReport?.phaseAnalysis && detailLevel !== 'simple') {
        const p = sessionReport.phaseAnalysis;
        crossRunLines.push(`Drive phase: ${p.driveEfficiency}% efficiency · Transition: ${p.transitionEfficiency}% · Velocity maintenance: ${p.maintenanceScore}%.`);
        if (p.technicalAssessment) {
            crossRunLines.push(p.technicalAssessment);
        }
    }

    // Impulse if available
    if (sessionReport?.impulseAnalysis && detailLevel !== 'simple') {
        const imp = sessionReport.impulseAnalysis;
        const frontLoad = imp.frontLoadedScore > 0.6
            ? 'well front-loaded'
            : imp.frontLoadedScore < 0.4
            ? 'back-loaded — consider earlier force application'
            : 'balanced';
        crossRunLines.push(`Impulse delivery is ${frontLoad}. 50% of total force reached at ${imp.timeToHalfImpulseS.toFixed(2)}s.`);
    }

    const crossRunSection = crossRunLines.length > 0 ? createSection({
        id:       'cross-run-analysis',
        type:     'session-quality',
        title:    'Run Analysis',
        priority: 'high',
        content:  crossRunLines,
    }) : null;

    // ── Watch-for section ─────────────────────────────────────────────────────
    const rawWatchItems = [
        // Only use narrative watchFor if it's a real coaching sentence (not a title fragment)
        narrative?.message?.watchFor &&
        !narrative.message.watchFor.startsWith('Quality held') &&
        narrative.message.watchFor.length > 20  // Filter out title fragments
            ? narrative.message.watchFor
            : null,

        // Warning insights — these are coaching observations
        ...(narrative?.insights ?? [])
            .filter((i) => i.tone === 'warning')
            .slice(0, 2)
            .map((i) => i.body)  // use body not title — body has the full sentence
            .filter((body: string) => body && body.length > 20 && !body.startsWith('Prioritise')),  // Filter out fragments and action instructions

        // Drop-off context — but only if drop-off was detected
        sessionReport?.dropOff?.dropOffRun !== null &&
        sessionReport?.dropOff?.dropOffRun !== undefined
            ? `Watch whether performance drops off at run ${sessionReport.dropOff.dropOffRun} again next session`
            : null,

        // Gap context — only if gap is meaningful
        sessionReport?.bestVsAvg?.gapPercent !== null &&
        sessionReport?.bestVsAvg?.gapPercent !== undefined &&
        sessionReport.bestVsAvg.gapPercent > 8
            ? `The gap between best and average run was ${sessionReport.bestVsAvg.gapPercent.toFixed(0)}% — worth tracking whether this closes`
            : null,
    ];

    const watchItems = compactLines(rawWatchItems.filter(Boolean) as string[]);

    const watchSection = watchItems.length > 0 ? createSection({
        id:       'watch-for',
        type:     'watch-for',
        title:    'Next Session',
        priority: 'medium',
        content:  watchForSection(watchItems, detailLevel),
    }) : null;

    const sections = [
        executiveSummarySection,      // 1. What happened — coaching headline + context
        keyFindingsSection,           // 2. Key findings — insights from analysis view  
        crossRunSection,              // 3. Run analysis — best vs avg, drop-off, phase
        createSection({               // 4. Session quality — scores + repeatability
            id:       'session-quality',
            type:     'session-quality',
            title:    'Session Quality',
            priority: 'high',
            content:  [
                ...sessionQualitySummary(qualityInput, detailLevel),
                ...repeatabilitySection(repeatInput, detailLevel),
            ],
            metrics,
        }),
        createSection({               // 5. Technique
            id:       'technique-analysis',
            type:     'technique-analysis',
            title:    'Technique',
            priority: 'medium',
            content:  [
                ...techniqueSection(techniqueInput, detailLevel),
                ...buildWheelieNotes(technique, detailLevel),
            ],
        }),
        watchSection,                 // 6. Next session — AFTER technique, before charts
        ...(includeCharts             // 7. Charts
            ? [createSection({
                id:       'charts',
                type:     'charts',
                title:    'Visual Evidence',
                priority: 'medium',
                content:  ['Charts support the coaching summary — they show the patterns described above.'],
                charts,
            })]
            : []),
        ...(includeDiag && (          // 8. Data quality — last, lowest priority
            detailLevel === 'coach' ||
            detailLevel === 'technical' ||
            !dqInput.analyticsValid ||
            dqInput.blocksPower ||
            dqInput.blocksSpeed ||
            cautionMetrics.length > 0 ||
            blockedMetrics.length > 0)
            ? [createSection({
                id:       'data-quality',
                type:     'data-quality',
                title:    'Data Quality',
                priority: 'low',
                content:  [
                    ...dataQualitySection(dqInput, detailLevel),
                    ...(cautionMetrics.length > 0
                        ? [`Use with caution: ${cautionMetrics.join(', ')} — conditions may affect these values.`]
                        : []),
                    ...(blockedMetrics.length > 0
                        ? [`Not available this session: ${blockedMetrics.join(', ')}.`]
                        : []),
                ],
            })]
            : []),

        // 9. Coaching log — rendered when notes exist
        ...buildCoachingLogSection(input),
    ].filter((s): s is NonNullable<typeof s> => s !== null);

    // ── Assemble report ───────────────────────────────────────────────────────

    // summary body — use impact if it's coaching language, not a UI description
    const summaryImpact = narrative?.message?.impact &&
        !narrative.message.impact.toLowerCase().includes('view') &&
        !narrative.message.impact.toLowerCase().includes('same data as')
            ? narrative.message.impact
            : null;

    const summaryBody = compactLines([
        summaryImpact ?? execLines[1] ?? null,
    ]);

    return {
        id:           reportId('coach-session-report'),
        type:         'coach-session',
        title:        'Session Report',
        subtitle:     input.sessionTitle ?? input.sessionDate,
        generatedAt:  new Date().toISOString(),
        detailLevel,
        subject: {
            riderName:    input.riderName,
            sessionId:    input.sessionId,
            sessionTitle: input.sessionTitle,
            sessionCount: 1,
        },
        summary: {
            headline: finalHeadline,
            confidence,
            body: summaryBody,
        },
        sections,
        charts,
        recommendations,
        appendices: options.includeAppendix
            ? [{
                id:      'session-appendix',
                title:   'Technical Detail',
                content: buildTechnicalAppendix(input),
            }]
            : undefined,
    };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildSessionRecommendations(
    input: CoachSessionReportInput,
    level: import('./types').ReportDetailLevel
): ReportRecommendation[] {
    const rawRecs = input.recommendations ?? input.sessionReport?.recommendations ?? [];

    if (Array.isArray(rawRecs) && rawRecs.length > 0) {
        return rawRecs.slice(0, 5).map((rec, index) => {
            // Handle both string and object recommendations
            if (typeof rec === 'string') {
                return createRecommendation({
                    id:       `session-rec-${index + 1}`,
                    priority: index === 0 ? 'high' : 'medium',
                    title:    `Focus ${index + 1}`,
                    body:     rec,
                });
            }
            // If it's already a structured recommendation
            return createRecommendation({
                id:       `session-rec-${index + 1}`,
                priority: rec.priority ?? (index === 0 ? 'high' : 'medium'),
                title:    rec.title ?? `Focus ${index + 1}`,
                body:     rec.body ?? rec.text ?? String(rec),
                watchFor: rec.watchFor,
            });
        });
    }

    // Default when no recommendations provided
    return [
        createRecommendation({
            id:       'session-rec-default',
            priority: 'medium',
            title:    'Keep collecting comparable sessions',
            body:     'Use the next session to confirm whether this pattern repeats.',
            watchFor: 'Similar reaction spread, set length, and drop-off behaviour.',
        }),
    ];
}

function buildWheelieNotes(
    technique: CoachSessionReportInput['techniqueSummary'],
    level: import('./types').ReportDetailLevel
): string[] {
    if (!technique) return [];

    const lines: string[] = [];
    const isSimple = level === 'simple';

    const wheelieCount    = technique.wheelieRunCount    ?? 0;
    const controlledCount = technique.controlledLiftCount ?? 0;
    const excessiveCount  = technique.excessiveLiftCount  ?? 0;

    if (wheelieCount === 0) return [];

    if (isSimple) {
        if (controlledCount > 0 && excessiveCount === 0) {
            lines.push(`Front wheel lifted on ${wheelieCount} run${wheelieCount === 1 ? '' : 's'} — controlled and within the useful range.`);
        } else if (excessiveCount > 0) {
            lines.push(`Front wheel lifted on ${wheelieCount} run${wheelieCount === 1 ? '' : 's'}, with ${excessiveCount} looking excessive. Worth checking with your coach whether this is costing you speed.`);
        }
    } else {
        lines.push(`Wheelie data: ${wheelieCount} lift${wheelieCount === 1 ? '' : 's'} detected (${controlledCount} controlled, ${excessiveCount} excessive${technique.lateLiftCount ? `, ${technique.lateLiftCount} late` : ''}).`);
        if (excessiveCount > 0) {
            lines.push('Excessive front wheel lift typically costs speed in the transition phase. Review timing and body position.');
        }
        if (technique.summary) {
            lines.push(technique.summary);
        }
    }

    return lines;
}

function buildTechnicalAppendix(input: CoachSessionReportInput): string[] {
    const lines: string[] = [];
    const q = input.dataQuality;
    const s = input.sessionReport;

    if (q) {
        lines.push('--- Data Quality ---');
        if (q.biasCorrection !== undefined && q.biasCorrection !== null) {
            lines.push(`Bias correction: ${q.biasCorrection} m/s²`);
        }
        if (q.blocksPower)              lines.push('Power calculations: blocked');
        if (q.blocksDistanceConfidence) lines.push('Speed confidence: reduced');
        if (!q.analyticsValid)          lines.push('Firmware analytics: invalid');
    }

    if (s) {
        lines.push('--- Session Intelligence ---');
        if (s.sessionQuality !== undefined)            lines.push(`Session quality: ${s.sessionQuality}/100`);
        if (s.repeatability?.overall !== undefined)    lines.push(`Repeatability: ${s.repeatability.overall}/100`);
        if (s.bestVsAvg?.gapPercent !== undefined)     lines.push(`Best-vs-avg gap: ${s.bestVsAvg.gapPercent.toFixed(1)}%`);
        if (s.setLength?.optimal !== undefined)        lines.push(`Optimal set length: ${s.setLength.optimal} runs`);
        if (s.dropOff?.dropOffRun !== undefined)       lines.push(`Drop-off at: run ${s.dropOff.dropOffRun}`);
    }

    return lines.length > 0 ? lines : ['No additional technical detail available.'];
}

function defaultSessionCharts(): ReportChart[] {
    return [
        {
            id:               'gforce-chart',
            title:            'G-Force Trace',
            description:      'Acceleration through the run — shape and peak timing.',
            chartType:        'line',
            dataKey:          'chartData',
            includeByDefault: true,
        },
        {
            id:               'session-quality-chart',
            title:            'Session Quality',
            description:      'Quality and repeatability score for this session.',
            chartType:        'bar',
            dataKey:          'sessionQuality',
            includeByDefault: true,
        },
        {
            id:               'drop-off-chart',
            title:            'Run-by-Run Progression',
            description:      'Shows where quality started to fall away in the set.',
            chartType:        'bar',
            dataKey:          'dropOff',
            includeByDefault: true,
        },
    ];
}

// ─── Coaching log ─────────────────────────────────────────────────────────────

const NOTE_TYPE_LABELS: Record<string, string> = {
    pre:    'Pre-session',
    during: 'During session',
    post:   'Post-session',
    coach:  'Coach feedback',
};

const AUTHOR_ROLE_LABELS: Record<string, string> = {
    rider:  'Rider',
    parent: 'Parent',
    coach:  'Coach',
};

/**
 * Build a coaching log section from session notes.
 * Notes are grouped by type and rendered in order: pre → during → post → coach.
 * Returns an empty array when no notes exist so the section is omitted.
 */
function buildCoachingLogSection(input: CoachSessionReportInput): ReturnType<typeof createSection>[] {
    const notes = input.sessionNotes;
    if (!notes || notes.length === 0) return [];

    const ORDER: Array<'pre' | 'during' | 'post' | 'coach'> = ['pre', 'during', 'post', 'coach'];
    const grouped: Record<string, typeof notes> = {};

    for (const note of notes) {
        if (!grouped[note.note_type]) grouped[note.note_type] = [];
        grouped[note.note_type].push(note);
    }

    const lines: string[] = [];

    for (const type of ORDER) {
        const typeNotes = grouped[type];
        if (!typeNotes || typeNotes.length === 0) continue;

        lines.push(`${NOTE_TYPE_LABELS[type] ?? type}:`);
        for (const note of typeNotes) {
            const author = note.author_role
                ? AUTHOR_ROLE_LABELS[note.author_role] ?? note.author_role
                : null;
            const prefix = author ? `[${author}] ` : '';
            lines.push(`${prefix}${note.content}`);
        }
        lines.push(''); // blank line between groups
    }

    // Remove trailing blank line
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    if (lines.length === 0) return [];

    return [createSection({
        id:       'coaching-log',
        type:     'appendix',
        title:    'Coaching Log',
        priority: 'low',
        content:  lines,
    })];
}
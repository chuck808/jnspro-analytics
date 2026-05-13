/**
 * Multi-Variable Correlation Analytics
 * Analyzes relationships between environmental/contextual factors and performance
 * 
 * Phase 3 Task 3.2
 */

export interface SessionDataPoint {
    sessionId: string;
    timestamp: string;
    // Performance metrics
    bestReactionMs: number | null;
    avgReactionMs: number | null;
    reactionCV: number | null;
    bestMaxG: number | null;
    bestPeakSpeedMs: number | null;
    techniqueScore: number | null;
    consistencyScore: number | null;
    // Context variables
    temperature?: number | null;
    weatherCondition?: string | null;
    trackSurface?: string | null;
    sessionFocus?: string | null;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | null;
    runCount?: number;
    fatigueLevel?: 'fresh' | 'normal' | 'tired' | null;
}

export interface CorrelationResult {
    variable1: string;
    variable2: string;
    correlation: number; // -1 to 1 (Pearson's r)
    pValue: number; // Statistical significance
    sampleSize: number;
    significant: boolean; // p < 0.05
    strength: 'very strong' | 'strong' | 'moderate' | 'weak' | 'very weak';
    direction: 'positive' | 'negative' | 'none';
}

export interface CorrelationInsight {
    id: string;
    title: string;
    description: string;
    correlation: CorrelationResult;
    actionable: boolean;
    priority: 'high' | 'medium' | 'low';
    example?: string;
}

/**
 * Calculate Pearson correlation coefficient
 */
export function calculateCorrelation(
    x: number[],
    y: number[]
): { r: number; n: number } | null {
    if (x.length !== y.length || x.length < 3) return null;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return null;

    const r = numerator / denominator;
    return { r, n };
}

/**
 * Simple t-test for correlation significance
 */
export function calculatePValue(r: number, n: number): number {
    if (n < 3) return 1;

    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const df = n - 2;

    // Simplified p-value approximation (two-tailed)
    // For production, use a proper statistical library
    const pApprox = Math.min(1, 2 * (1 - normalCDF(Math.abs(t))));
    return pApprox;
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
}

/**
 * Classify correlation strength
 */
export function classifyCorrelationStrength(r: number): CorrelationResult['strength'] {
    const abs = Math.abs(r);
    if (abs >= 0.8) return 'very strong';
    if (abs >= 0.6) return 'strong';
    if (abs >= 0.4) return 'moderate';
    if (abs >= 0.2) return 'weak';
    return 'very weak';
}

/**
 * Analyze correlation between two variables
 */
export function analyzeCorrelation(
    data: SessionDataPoint[],
    variable1Key: keyof SessionDataPoint,
    variable2Key: keyof SessionDataPoint,
    variable1Label: string,
    variable2Label: string
): CorrelationResult | null {
    // Extract numeric pairs (filter out nulls)
    const pairs: [number, number][] = [];

    for (const point of data) {
        const val1 = point[variable1Key];
        const val2 = point[variable2Key];

        if (typeof val1 === 'number' && typeof val2 === 'number' && !isNaN(val1) && !isNaN(val2)) {
            pairs.push([val1, val2]);
        }
    }

    if (pairs.length < 3) return null;

    const x = pairs.map(p => p[0]);
    const y = pairs.map(p => p[1]);

    const result = calculateCorrelation(x, y);
    if (!result) return null;

    const pValue = calculatePValue(result.r, result.n);

    return {
        variable1: variable1Label,
        variable2: variable2Label,
        correlation: result.r,
        pValue,
        sampleSize: result.n,
        significant: pValue < 0.05,
        strength: classifyCorrelationStrength(result.r),
        direction: result.r > 0.1 ? 'positive' : result.r < -0.1 ? 'negative' : 'none',
    };
}

/**
 * Analyze categorical correlation (e.g., weather condition vs performance)
 */
export function analyzeCategoricalCorrelation(
    data: SessionDataPoint[],
    categoryKey: keyof SessionDataPoint,
    metricKey: keyof SessionDataPoint,
    categoryLabel: string,
    metricLabel: string
): { category: string; mean: number; count: number; stdDev: number }[] {
    const groups = new Map<string, number[]>();

    for (const point of data) {
        const category = point[categoryKey];
        const value = point[metricKey];

        if (category && typeof value === 'number' && !isNaN(value)) {
            const key = String(category);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(value);
        }
    }

    const results: { category: string; mean: number; count: number; stdDev: number }[] = [];

    for (const [category, values] of groups.entries()) {
        if (values.length < 2) continue;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        results.push({
            category,
            mean,
            count: values.length,
            stdDev,
        });
    }

    return results.sort((a, b) => b.count - a.count);
}

/**
 * Multi-variable insight synthesizer
 * Combines multiple correlations to generate contextual narratives
 */
interface InsightContext {
    tempReaction?: CorrelationResult | null;
    tempMaxG?: CorrelationResult | null;
    timeOfDayPerf?: { category: string; mean: number; count: number; stdDev: number }[];
    surfaceConsistency?: { category: string; mean: number; count: number; stdDev: number }[];
    runCountConsistency?: CorrelationResult | null;
}

function synthesizeMultiVariableInsights(
    context: InsightContext,
    insightId: number
): CorrelationInsight[] {
    const synthesized: CorrelationInsight[] = [];

    // 1. Temperature + Time of Day synthesis
    if (context.tempReaction && context.timeOfDayPerf && context.timeOfDayPerf.length >= 2) {
        const sorted = [...context.timeOfDayPerf].sort((a, b) => a.mean - b.mean);
        const bestTime = sorted[0];
        const worstTime = sorted[sorted.length - 1];

        if (bestTime.count >= 3 && worstTime.count >= 3 && context.tempReaction.significant) {
            const tempDirection = context.tempReaction.direction === 'negative' ? 'warmer' : 'colder';
            const timeDiff = ((worstTime.mean - bestTime.mean) / bestTime.mean * 100).toFixed(1);

            // Check if temperature effect is conditional on time of day
            const narrative = [
                `Your ${bestTime.category} sessions show ${timeDiff}% better reaction times compared to ${worstTime.category} sessions (${bestTime.mean.toFixed(0)}ms vs ${worstTime.mean.toFixed(0)}ms across ${bestTime.count + worstTime.count} sessions).`,
            ];

            if (context.tempReaction.correlation < -0.3) {
                narrative.push(
                    `Additionally, you perform ${Math.abs(context.tempReaction.correlation * 100).toFixed(0)}% better in ${tempDirection} conditions.`
                );
                narrative.push(
                    `This suggests your ${bestTime.category} advantage may be enhanced by ${tempDirection} temperatures, likely due to optimal muscle temperature regulation combined with circadian alertness.`
                );
            } else {
                narrative.push(
                    `Your time-of-day advantage appears consistent across different temperatures, suggesting circadian rhythm is the primary factor.`
                );
            }

            // Actionable recommendation
            if (tempDirection === 'warmer' && bestTime.category === 'morning') {
                narrative.push(
                    `**Recommendation:** Schedule important sessions and competitions for warm mornings when both factors align in your favor.`
                );
            } else if (tempDirection === 'colder' && bestTime.category === 'morning') {
                narrative.push(
                    `**Recommendation:** On cold mornings, extend your warmup by 5-10 minutes to maintain your time-of-day advantage.`
                );
            }

            synthesized.push({
                id: `insight-multi-${insightId++}`,
                title: `🎯 Peak Performance Window: ${bestTime.category.charAt(0).toUpperCase() + bestTime.category.slice(1)} + ${tempDirection.charAt(0).toUpperCase() + tempDirection.slice(1)} conditions`,
                description: narrative.join(' '),
                correlation: context.tempReaction,
                actionable: true,
                priority: 'high',
                example: `Best: ${bestTime.category} in ${tempDirection} weather`,
            });
        }
    }

    // 2. Surface + Consistency + Run Count synthesis
    if (context.surfaceConsistency && context.runCountConsistency && context.surfaceConsistency.length >= 2) {
        const sorted = [...context.surfaceConsistency].sort((a, b) => a.mean - b.mean);
        const bestSurface = sorted[0];
        const worstSurface = sorted[sorted.length - 1];

        if (bestSurface.count >= 3 && worstSurface.count >= 3 && context.runCountConsistency.significant) {
            const consistencyTrend = context.runCountConsistency.direction === 'positive' ? 'decreases' : 'improves';
            const surfaceDiff = ((worstSurface.mean - bestSurface.mean) / bestSurface.mean * 100).toFixed(0);

            const narrative = [
                `Your consistency varies significantly across track conditions: ${surfaceDiff}% better on ${bestSurface.category} (${bestSurface.mean.toFixed(1)}% CV) versus ${worstSurface.category} (${worstSurface.mean.toFixed(1)}% CV).`,
                `Furthermore, your consistency ${consistencyTrend} as session length increases (r=${context.runCountConsistency.correlation.toFixed(2)}).`,
            ];

            if (context.runCountConsistency.direction === 'positive') {
                narrative.push(
                    `This pattern suggests you may fatigue faster on ${worstSurface.category} surfaces. Consider shorter, more focused sessions (6-8 runs) when training on ${worstSurface.category} to maintain quality over quantity.`
                );
            } else {
                narrative.push(
                    `Interestingly, longer sessions help your consistency, even on ${worstSurface.category}. This suggests you benefit from extended warmup and rhythm-building, particularly on challenging surfaces.`
                );
            }

            synthesized.push({
                id: `insight-multi-${insightId++}`,
                title: `🏁 Surface-Specific Training Strategy`,
                description: narrative.join(' '),
                correlation: context.runCountConsistency,
                actionable: true,
                priority: 'medium',
                example: `Adapt session length based on track surface`,
            });
        }
    }

    // 3. Temperature + Max G (Power output in different conditions)
    if (context.tempMaxG && context.tempReaction && context.tempMaxG.significant && context.tempReaction.significant) {
        const tempPowerDirection = context.tempMaxG.direction === 'positive' ? 'higher' : 'lower';
        const tempReactionDirection = context.tempReaction.direction === 'negative' ? 'faster' : 'slower';
        const conditions = context.tempMaxG.direction === 'positive' ? 'warmer' : 'colder';

        const narrative = [
            `Temperature affects both your reaction speed and explosive power.`,
            `In ${conditions} conditions, your reaction time is ${tempReactionDirection} (${Math.abs(context.tempReaction.correlation * 100).toFixed(0)}% correlation) and your peak G-force is ${tempPowerDirection} (${Math.abs(context.tempMaxG.correlation * 100).toFixed(0)}% correlation).`,
        ];

        // Check if both correlate in same direction (consistent) or opposite (trade-off)
        if ((context.tempMaxG.direction === 'positive' && context.tempReaction.direction === 'negative') ||
            (context.tempMaxG.direction === 'negative' && context.tempReaction.direction === 'positive')) {
            // Same beneficial direction (warmer = faster reaction AND higher power, or vice versa)
            narrative.push(
                `Both components improve together in ${conditions} conditions, suggesting a unified physiological response. Your neuromuscular system operates optimally at ${conditions === 'warmer' ? 'elevated' : 'lower'} temperatures.`
            );
            narrative.push(
                `**Recommendation:** In ${conditions === 'warmer' ? 'cold' : 'hot'} weather, compensate with extended dynamic warmup targeting both explosive power and reaction drills.`
            );
        } else {
            // Opposite directions (trade-off)
            narrative.push(
                `Interestingly, these effects work in opposite directions, suggesting different physiological mechanisms. Your reaction speed and power may respond differently to temperature changes.`
            );
        }

        synthesized.push({
            id: `insight-multi-${insightId++}`,
            title: `🌡️ Temperature's Dual Impact on Performance`,
            description: narrative.join(' '),
            correlation: context.tempMaxG,
            actionable: true,
            priority: Math.abs(context.tempMaxG.correlation) > 0.5 ? 'high' : 'medium',
        });
    }

    return synthesized;
}

/**
 * Generate natural language insights from correlation results
 */
export function generateCorrelationInsights(
    data: SessionDataPoint[],
    minSessions: number = 10
): CorrelationInsight[] {
    if (data.length < minSessions) {
        return [];
    }

    const insights: CorrelationInsight[] = [];
    let insightId = 0;

    // 1. Temperature vs Reaction Time
    const tempReaction = analyzeCorrelation(
        data,
        'temperature',
        'bestReactionMs',
        'Temperature',
        'Reaction Time'
    );

    if (tempReaction && tempReaction.significant && Math.abs(tempReaction.correlation) > 0.3) {
        const direction = tempReaction.direction === 'negative' ? 'faster' : 'slower';
        const tempThreshold = tempReaction.direction === 'negative' ? 'warmer' : 'colder';
        const improvementPct = Math.abs(tempReaction.correlation * 100).toFixed(0);

        insights.push({
            id: `insight-${insightId++}`,
            title: `Temperature affects your reaction time`,
            description: `You tend to be ${direction} in ${tempThreshold} conditions. ${improvementPct}% correlation detected across ${tempReaction.sampleSize} sessions.`,
            correlation: tempReaction,
            actionable: true,
            priority: Math.abs(tempReaction.correlation) > 0.6 ? 'high' : 'medium',
            example: tempReaction.direction === 'negative'
                ? 'Consider warming up more in cold conditions'
                : 'Peak performance seems to be in cooler temperatures',
        });
    }

    // 2. Track Surface vs Consistency
    const surfaceConsistency = analyzeCategoricalCorrelation(
        data,
        'trackSurface',
        'reactionCV',
        'Track Surface',
        'Consistency (CV%)'
    );

    if (surfaceConsistency.length >= 2) {
        const sorted = [...surfaceConsistency].sort((a, b) => a.mean - b.mean);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        if (best.count >= 3 && worst.count >= 3) {
            const diffPct = ((worst.mean - best.mean) / best.mean * 100).toFixed(0);

            insights.push({
                id: `insight-${insightId++}`,
                title: `Track condition impacts consistency`,
                description: `Your consistency is ${diffPct}% better on ${best.category} vs ${worst.category} surface. ${best.category}: ${best.mean.toFixed(1)}% CV (n=${best.count}), ${worst.category}: ${worst.mean.toFixed(1)}% CV (n=${worst.count}).`,
                correlation: {
                    variable1: 'Track Surface',
                    variable2: 'Consistency',
                    correlation: 0, // Categorical, not linear
                    pValue: 0,
                    sampleSize: surfaceConsistency.reduce((s, c) => s + c.count, 0),
                    significant: true,
                    strength: 'moderate',
                    direction: 'none',
                },
                actionable: true,
                priority: parseInt(diffPct) > 15 ? 'high' : 'medium',
                example: `Practice more on ${worst.category} to improve adaptation`,
            });
        }
    }

    // 3. Run Count vs Consistency
    const runCountConsistency = analyzeCorrelation(
        data,
        'runCount',
        'reactionCV',
        'Runs per Session',
        'Consistency'
    );

    if (runCountConsistency && runCountConsistency.significant && Math.abs(runCountConsistency.correlation) > 0.3) {
        const trend = runCountConsistency.direction === 'positive' ? 'decreases' : 'improves';
        const optimal = runCountConsistency.direction === 'positive' ? 'fewer' : 'more';

        insights.push({
            id: `insight-${insightId++}`,
            title: `Session length affects your consistency`,
            description: `Consistency ${trend} with ${optimal} runs per session (${runCountConsistency.strength} ${runCountConsistency.direction} correlation, r=${runCountConsistency.correlation.toFixed(2)}).`,
            correlation: runCountConsistency,
            actionable: true,
            priority: 'medium',
            example: runCountConsistency.direction === 'positive'
                ? 'Consider shorter, more focused sessions (6-8 runs)'
                : 'You may benefit from longer warmup/volume',
        });
    }

    // 4. Time of Day vs Performance
    const timeOfDayPerf = analyzeCategoricalCorrelation(
        data,
        'timeOfDay',
        'bestReactionMs',
        'Time of Day',
        'Reaction Time'
    );

    if (timeOfDayPerf.length >= 2) {
        const sorted = [...timeOfDayPerf].sort((a, b) => a.mean - b.mean);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        if (best.count >= 3 && worst.count >= 3) {
            const diffMs = worst.mean - best.mean;
            const diffPct = (diffMs / best.mean * 100).toFixed(1);

            insights.push({
                id: `insight-${insightId++}`,
                title: `Best performance time: ${best.category}`,
                description: `You're ${diffPct}% faster (${diffMs.toFixed(0)}ms) in the ${best.category} vs ${worst.category}. ${best.category}: ${best.mean.toFixed(0)}ms avg, ${worst.category}: ${worst.mean.toFixed(0)}ms avg.`,
                correlation: {
                    variable1: 'Time of Day',
                    variable2: 'Reaction Time',
                    correlation: 0,
                    pValue: 0,
                    sampleSize: timeOfDayPerf.reduce((s, c) => s + c.count, 0),
                    significant: true,
                    strength: 'moderate',
                    direction: 'none',
                },
                actionable: true,
                priority: parseInt(diffPct) > 5 ? 'high' : 'low',
                example: `Schedule important sessions/competitions in the ${best.category}`,
            });
        }
    }

    // 5. Temperature vs Max G (explosiveness in different conditions)
    const tempMaxG = analyzeCorrelation(
        data,
        'temperature',
        'bestMaxG',
        'Temperature',
        'Peak G-Force'
    );

    if (tempMaxG && tempMaxG.significant && Math.abs(tempMaxG.correlation) > 0.3) {
        const direction = tempMaxG.direction === 'positive' ? 'higher' : 'lower';
        const conditions = tempMaxG.direction === 'positive' ? 'warmer' : 'colder';

        insights.push({
            id: `insight-${insightId++}`,
            title: `Explosive power varies with temperature`,
            description: `Peak G-force is ${direction} in ${conditions} conditions (${tempMaxG.strength} correlation, r=${tempMaxG.correlation.toFixed(2)}).`,
            correlation: tempMaxG,
            actionable: true,
            priority: 'low',
            example: 'Muscles may perform differently in varying temperatures',
        });
    }

    // 6. Generate multi-variable synthesized insights
    const synthesizedInsights = synthesizeMultiVariableInsights(
        {
            tempReaction,
            tempMaxG,
            timeOfDayPerf,
            surfaceConsistency,
            runCountConsistency,
        },
        insightId
    );

    // Combine individual insights with synthesized multi-variable insights
    // Synthesized insights take priority as they provide more context
    const allInsights = [...synthesizedInsights, ...insights];

    return allInsights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

/**
 * Extract time of day from timestamp
 */
export function getTimeOfDay(timestamp: string): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date(timestamp).getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
}

/**
 * Prepare session data for correlation analysis
 */
export function prepareCorrelationData(
    sessions: any[],
    sessionStats: any[]
): SessionDataPoint[] {
    return sessions.map((session, idx) => {
        const stats = sessionStats[idx];

        return {
            sessionId: session.id,
            timestamp: session.timestamp,
            bestReactionMs: stats?.best_reaction_ms ?? null,
            avgReactionMs: stats?.avg_reaction_ms ?? null,
            reactionCV: stats?.reaction_cv ?? null,
            bestMaxG: stats?.best_max_g ?? null,
            bestPeakSpeedMs: stats?.best_peak_speed_ms ?? null,
            techniqueScore: null, // Would need to be calculated
            consistencyScore: stats?.reaction_cv ? Math.max(0, 100 - stats.reaction_cv) : null,
            temperature: session.temperature ?? null,
            weatherCondition: session.weather_conditions ?? null,
            trackSurface: session.track_surface ?? null,
            sessionFocus: session.session_focus ?? null,
            timeOfDay: getTimeOfDay(session.timestamp),
            runCount: stats?.run_count ?? 0,
            fatigueLevel: null, // Would need to be added to sessions table
        };
    });
}

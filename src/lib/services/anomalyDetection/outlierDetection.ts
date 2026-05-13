/**
 * Outlier Detection for Performance Anomalies
 * 
 * Detects unusual performance values that deviate significantly from normal patterns.
 * Uses statistical methods (z-scores, IQR) and moving averages.
 */

export type AnomalyType = 'performance_drop' | 'performance_spike' | 'unusual_variability' | 'sudden_change';
export type Severity = 'info' | 'warning' | 'critical';

export interface PerformanceAnomaly {
    type: AnomalyType;
    severity: Severity;
    sessionId: string;
    metric: string;
    expectedValue: number;
    actualValue: number;
    zScore: number;
    description: string;
    recommendation?: string;
}

interface DataPoint {
    sessionId: string;
    value: number;
    timestamp: string;
}

/**
 * Detect outliers using z-score method
 * @param dataPoints Historical performance data
 * @param metric Metric name (for description)
 * @param lowerIsBetter True for metrics like reaction time
 * @param threshold Z-score threshold (default 2 = ~95% confidence)
 * @returns Array of detected anomalies
 */
export function detectOutliers(
    dataPoints: DataPoint[],
    metric: string,
    lowerIsBetter: boolean,
    threshold: number = 2
): PerformanceAnomaly[] {
    if (dataPoints.length < 3) return []; // Need minimum data

    const anomalies: PerformanceAnomaly[] = [];
    const values = dataPoints.map(p => p.value);

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Check each point for outliers
    for (let i = 0; i < dataPoints.length; i++) {
        const point = dataPoints[i];
        const zScore = (point.value - mean) / stdDev;

        // Significant deviation from mean
        if (Math.abs(zScore) > threshold) {
            const isPerformanceDrop = lowerIsBetter 
                ? zScore > 0  // Higher value is worse
                : zScore < 0; // Lower value is worse

            const severity: Severity = Math.abs(zScore) > 3 ? 'critical' : 
                                       Math.abs(zScore) > 2.5 ? 'warning' : 'info';

            anomalies.push({
                type: isPerformanceDrop ? 'performance_drop' : 'performance_spike',
                severity,
                sessionId: point.sessionId,
                metric,
                expectedValue: mean,
                actualValue: point.value,
                zScore,
                description: `${metric} was ${Math.abs(zScore).toFixed(1)} standard deviations ${isPerformanceDrop ? 'worse' : 'better'} than average`,
                recommendation: isPerformanceDrop ? getSuggestionForDrop(metric, Math.abs(zScore)) : undefined
            });
        }
    }

    return anomalies;
}

/**
 * Detect sudden changes between consecutive sessions
 */
export function detectSuddenChanges(
    dataPoints: DataPoint[],
    metric: string,
    lowerIsBetter: boolean,
    changeThreshold: number = 0.15 // 15% change
): PerformanceAnomaly[] {
    if (dataPoints.length < 2) return [];

    const anomalies: PerformanceAnomaly[] = [];

    for (let i = 1; i < dataPoints.length; i++) {
        const prev = dataPoints[i - 1];
        const curr = dataPoints[i];

        const percentChange = Math.abs((curr.value - prev.value) / prev.value);

        if (percentChange > changeThreshold) {
            const isWorse = lowerIsBetter 
                ? curr.value > prev.value
                : curr.value < prev.value;

            const severity: Severity = percentChange > 0.30 ? 'critical' :
                                       percentChange > 0.20 ? 'warning' : 'info';

            anomalies.push({
                type: 'sudden_change',
                severity,
                sessionId: curr.sessionId,
                metric,
                expectedValue: prev.value,
                actualValue: curr.value,
                zScore: 0, // Not z-score based
                description: `${metric} changed by ${(percentChange * 100).toFixed(1)}% from previous session`,
                recommendation: isWorse ? `Sudden performance drop detected. Review session conditions and recovery status.` : undefined
            });
        }
    }

    return anomalies;
}

/**
 * Detect unusual variability (inconsistency) within recent sessions
 */
export function detectUnusualVariability(
    dataPoints: DataPoint[],
    metric: string,
    windowSize: number = 5
): PerformanceAnomaly[] {
    if (dataPoints.length < windowSize) return [];

    const anomalies: PerformanceAnomaly[] = [];

    // Calculate rolling CV (coefficient of variation)
    for (let i = windowSize; i <= dataPoints.length; i++) {
        const window = dataPoints.slice(i - windowSize, i);
        const values = window.map(p => p.value);

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / mean) * 100; // Coefficient of variation as percentage

        // High CV indicates inconsistency
        if (cv > 15) { // More than 15% variability
            const severity: Severity = cv > 25 ? 'warning' : 'info';
            const latestSession = window[window.length - 1];

            anomalies.push({
                type: 'unusual_variability',
                severity,
                sessionId: latestSession.sessionId,
                metric,
                expectedValue: mean,
                actualValue: cv,
                zScore: 0,
                description: `High variability in ${metric} (${cv.toFixed(1)}% CV) over last ${windowSize} sessions`,
                recommendation: `Inconsistent performance may indicate fatigue, varying conditions, or technique issues.`
            });
        }
    }

    return anomalies;
}

/**
 * Detect anomalies using moving average
 * Good for detecting gradual shifts and trends
 */
export function detectMovingAverageAnomalies(
    dataPoints: DataPoint[],
    metric: string,
    lowerIsBetter: boolean,
    windowSize: number = 5
): PerformanceAnomaly[] {
    if (dataPoints.length < windowSize + 2) return [];

    const anomalies: PerformanceAnomaly[] = [];

    // Calculate moving average
    for (let i = windowSize; i < dataPoints.length; i++) {
        const window = dataPoints.slice(i - windowSize, i);
        const movingAvg = window.reduce((sum, p) => sum + p.value, 0) / windowSize;
        
        const current = dataPoints[i];
        const deviation = Math.abs(current.value - movingAvg) / movingAvg;

        // Significant deviation from moving average
        if (deviation > 0.20) { // 20% deviation
            const isWorse = lowerIsBetter
                ? current.value > movingAvg
                : current.value < movingAvg;

            if (isWorse) {
                const severity: Severity = deviation > 0.35 ? 'warning' : 'info';

                anomalies.push({
                    type: 'performance_drop',
                    severity,
                    sessionId: current.sessionId,
                    metric,
                    expectedValue: movingAvg,
                    actualValue: current.value,
                    zScore: 0,
                    description: `${metric} is ${(deviation * 100).toFixed(1)}% worse than recent average`,
                    recommendation: getSuggestionForDrop(metric, deviation * 10)
                });
            }
        }
    }

    return anomalies;
}

/**
 * Get contextual suggestions for performance drops
 */
function getSuggestionForDrop(metric: string, severity: number): string {
    const suggestions: string[] = [];

    if (severity > 3) {
        suggestions.push('This is a significant performance drop. Consider taking a rest day.');
    }

    if (metric.toLowerCase().includes('reaction')) {
        suggestions.push('Review your starting technique and mental preparation.');
        suggestions.push('Check if fatigue or stress might be affecting reaction time.');
    } else if (metric.toLowerCase().includes('speed')) {
        suggestions.push('Check sensor placement and calibration.');
        suggestions.push('Review track conditions and equipment setup.');
    } else if (metric.toLowerCase().includes('power') || metric.toLowerCase().includes('g')) {
        suggestions.push('Assess muscle fatigue and recovery status.');
        suggestions.push('Consider strength training or recovery protocols.');
    }

    if (severity > 2) {
        suggestions.push('Document any changes in equipment, environment, or training load.');
    }

    return suggestions.join(' ');
}

/**
 * Comprehensive anomaly detection combining all methods
 */
export function detectAllAnomalies(
    dataPoints: DataPoint[],
    metric: string,
    lowerIsBetter: boolean
): PerformanceAnomaly[] {
    const allAnomalies: PerformanceAnomaly[] = [];

    // Z-score outliers
    allAnomalies.push(...detectOutliers(dataPoints, metric, lowerIsBetter, 2));

    // Sudden changes
    allAnomalies.push(...detectSuddenChanges(dataPoints, metric, lowerIsBetter, 0.15));

    // Unusual variability
    allAnomalies.push(...detectUnusualVariability(dataPoints, metric, 5));

    // Moving average anomalies
    if (dataPoints.length >= 7) {
        allAnomalies.push(...detectMovingAverageAnomalies(dataPoints, metric, lowerIsBetter, 5));
    }

    // Deduplicate and sort by severity
    return deduplicateAnomalies(allAnomalies);
}

/**
 * Remove duplicate anomalies for the same session
 * Keep the most severe one
 */
function deduplicateAnomalies(anomalies: PerformanceAnomaly[]): PerformanceAnomaly[] {
    const bySession = new Map<string, PerformanceAnomaly>();

    const severityScore = (s: Severity) => s === 'critical' ? 3 : s === 'warning' ? 2 : 1;

    for (const anomaly of anomalies) {
        const existing = bySession.get(anomaly.sessionId);
        
        if (!existing || severityScore(anomaly.severity) > severityScore(existing.severity)) {
            bySession.set(anomaly.sessionId, anomaly);
        }
    }

    return Array.from(bySession.values()).sort((a, b) => {
        // Sort by severity, then by session ID
        const severityDiff = severityScore(b.severity) - severityScore(a.severity);
        return severityDiff !== 0 ? severityDiff : b.sessionId.localeCompare(a.sessionId);
    });
}

/**
 * Anomaly Detection Service
 *
 * Comprehensive system for detecting performance anomalies, assessing fatigue,
 * evaluating injury risk, and managing alerts.
 */

// Re-export all modules
export * from './outlierDetection';
export * from './fatigueAnalysis';
export * from './injuryRisk';
export * from './alertManager';

// Main integrated detection interface
import { detectAllAnomalies, type PerformanceAnomaly } from './outlierDetection';
import { analyzeFatigue, type FatigueAssessment } from './fatigueAnalysis';
import { assessInjuryRisk, analyzeTrainingPattern, type InjuryRiskAssessment } from './injuryRisk';
import { consolidateAlerts, type AlertSummary } from './alertManager';

/**
 * Comprehensive health check for a user's training status
 * This is the main entry point for anomaly detection
 */
export interface TrainingHealthCheck {
	anomalies: PerformanceAnomaly[];
	fatigueAssessment: FatigueAssessment | null;
	injuryRiskAssessment: InjuryRiskAssessment | null;
	alerts: AlertSummary;
	overallStatus: 'healthy' | 'monitor' | 'caution' | 'critical';
	shouldRest: boolean;
}

/**
 * Perform comprehensive health check on training data
 *
 * @param performanceData Recent performance metrics
 * @param sessionHistory Full session history
 * @returns Complete health assessment with alerts
 */
export function performHealthCheck(
	performanceData: {
		metric: string;
		lowerIsBetter: boolean;
		dataPoints: Array<{
			sessionId: string;
			value: number;
			timestamp: string;
		}>;
	},
	sessionHistory: Array<{
		sessionId: string;
		timestamp: string;
		bestValue: number;
		avgValue: number;
		consistency: number;
		runCount: number;
	}>
): TrainingHealthCheck {
	// 1. Detect performance anomalies
	const anomalies = detectAllAnomalies(
		performanceData.dataPoints,
		performanceData.metric,
		performanceData.lowerIsBetter
	);

	// 2. Analyze fatigue
	const fatigueAssessment =
		sessionHistory.length >= 3
			? analyzeFatigue(sessionHistory, performanceData.metric, performanceData.lowerIsBetter)
			: null;

	// 3. Assess injury risk
	let injuryRiskAssessment: InjuryRiskAssessment | null = null;
	if (fatigueAssessment && sessionHistory.length >= 3) {
		const trainingPattern = analyzeTrainingPattern(sessionHistory);
		injuryRiskAssessment = assessInjuryRisk(fatigueAssessment, anomalies, trainingPattern);
	}

	// 4. Consolidate alerts
	const alerts = consolidateAlerts(anomalies, fatigueAssessment, injuryRiskAssessment);

	// 5. Determine overall status
	const overallStatus = determineOverallStatus(alerts, fatigueAssessment, injuryRiskAssessment);

	// 6. Rest recommendation
	const shouldRest = determineShouldRest(fatigueAssessment, injuryRiskAssessment, alerts);

	return {
		anomalies,
		fatigueAssessment,
		injuryRiskAssessment,
		alerts,
		overallStatus,
		shouldRest
	};
}

/**
 * Determine overall training status
 */
function determineOverallStatus(
	alerts: AlertSummary,
	fatigueAssessment: FatigueAssessment | null,
	injuryRiskAssessment: InjuryRiskAssessment | null
): TrainingHealthCheck['overallStatus'] {
	// Critical if any critical alerts
	if (alerts.critical > 0) return 'critical';

	// Critical if injury risk is high/critical
	if (
		injuryRiskAssessment &&
		(injuryRiskAssessment.riskLevel === 'critical' || injuryRiskAssessment.riskLevel === 'high')
	) {
		return 'critical';
	}

	// Caution if fatigue is high
	if (fatigueAssessment && fatigueAssessment.fatigueScore >= 60) {
		return 'caution';
	}

	// Caution if multiple warnings
	if (alerts.warning >= 2) return 'caution';

	// Monitor if any warnings or moderate issues
	if (alerts.warning > 0 || alerts.info > 0) return 'monitor';
	if (injuryRiskAssessment && injuryRiskAssessment.riskLevel === 'moderate') return 'monitor';
	if (fatigueAssessment && fatigueAssessment.fatigueScore >= 30) return 'monitor';

	return 'healthy';
}

/**
 * Determine if user should rest
 */
function determineShouldRest(
	fatigueAssessment: FatigueAssessment | null,
	injuryRiskAssessment: InjuryRiskAssessment | null,
	alerts: AlertSummary
): boolean {
	// Rest if critical alerts
	if (alerts.critical > 0) return true;

	// Rest if injury risk is high
	if (
		injuryRiskAssessment &&
		(injuryRiskAssessment.riskLevel === 'high' || injuryRiskAssessment.riskLevel === 'critical')
	) {
		return true;
	}

	// Rest if fatigue score is high
	if (fatigueAssessment && fatigueAssessment.fatigueScore >= 60) {
		return true;
	}

	// Rest if recommended action is rest
	if (
		fatigueAssessment &&
		(fatigueAssessment.recommendedAction === 'rest_day' ||
			fatigueAssessment.recommendedAction === 'extended_rest')
	) {
		return true;
	}

	return false;
}

/**
 * Get user-friendly status message
 */
export function getStatusMessage(healthCheck: TrainingHealthCheck): string {
	switch (healthCheck.overallStatus) {
		case 'healthy':
			return "✅ You're in great shape! Continue training as planned.";
		case 'monitor':
			return '👁️ Minor issues detected. Continue training but monitor your recovery.';
		case 'caution':
			return '⚠️ Caution advised. Consider reducing intensity or taking a rest day.';
		case 'critical':
			return '🚨 STOP TRAINING. Rest is required to prevent injury.';
	}
}

/**
 * Get status color for UI
 */
export function getStatusColor(healthCheck: TrainingHealthCheck): string {
	switch (healthCheck.overallStatus) {
		case 'healthy':
			return '#3de8c8'; // Teal
		case 'monitor':
			return '#f5a623'; // Amber
		case 'caution':
			return '#ff6b3d'; // Orange
		case 'critical':
			return '#ff4444'; // Red
	}
}

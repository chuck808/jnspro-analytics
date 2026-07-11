/**
 * Alert Manager
 *
 * Consolidates anomaly detection, fatigue analysis, and injury risk assessment
 * into actionable alerts for users. Manages alert priorities and dismissal.
 */

import type { PerformanceAnomaly, Severity } from './outlierDetection';
import type { FatigueAssessment } from './fatigueAnalysis';
import type { InjuryRiskAssessment } from './injuryRisk';

export type AlertType = 'anomaly' | 'fatigue' | 'injury_risk' | 'goal_adjustment' | 'achievement';
export type AlertPriority = 'info' | 'warning' | 'critical';

export interface Alert {
	id: string;
	type: AlertType;
	priority: AlertPriority;
	title: string;
	message: string;
	actionRequired: boolean;
	actionText?: string;
	actionUrl?: string;
	timestamp: Date;
	dismissible: boolean;
	metadata?: Record<string, any>;
}

export interface AlertSummary {
	total: number;
	critical: number;
	warning: number;
	info: number;
	alerts: Alert[];
}

/**
 * Generate alerts from anomaly detection results
 */
export function generateAnomalyAlerts(anomalies: PerformanceAnomaly[]): Alert[] {
	return anomalies.map((anomaly) => {
		const priority: AlertPriority =
			anomaly.severity === 'critical'
				? 'critical'
				: anomaly.severity === 'warning'
					? 'warning'
					: 'info';

		return {
			id: `anomaly-${anomaly.sessionId}-${anomaly.metric}`,
			type: 'anomaly',
			priority,
			title: getAnomalyTitle(anomaly.type),
			message: anomaly.description + (anomaly.recommendation ? ` ${anomaly.recommendation}` : ''),
			actionRequired: anomaly.severity !== 'info',
			actionText: anomaly.severity === 'critical' ? 'Review Session' : undefined,
			actionUrl: `/sessions/${anomaly.sessionId}`,
			timestamp: new Date(),
			dismissible: anomaly.severity === 'info',
			metadata: {
				sessionId: anomaly.sessionId,
				metric: anomaly.metric,
				zScore: anomaly.zScore
			}
		};
	});
}

/**
 * Generate alert from fatigue assessment
 */
export function generateFatigueAlert(assessment: FatigueAssessment): Alert | null {
	if (assessment.fatigueScore < 30) return null; // No alert needed

	const priority: AlertPriority =
		assessment.fatigueScore >= 70 ? 'critical' : assessment.fatigueScore >= 50 ? 'warning' : 'info';

	const title =
		assessment.fatigueScore >= 70
			? '🚨 High Fatigue Detected'
			: assessment.fatigueScore >= 50
				? '⚠️ Fatigue Warning'
				: '💡 Fatigue Notice';

	const actionText =
		assessment.recommendedAction === 'extended_rest'
			? 'Take Extended Rest'
			: assessment.recommendedAction === 'rest_day'
				? 'Schedule Rest Day'
				: assessment.recommendedAction === 'reduce_intensity'
					? 'Reduce Intensity'
					: 'Continue Monitoring';

	return {
		id: `fatigue-${Date.now()}`,
		type: 'fatigue',
		priority,
		title,
		message: `Fatigue score: ${assessment.fatigueScore}/100. ${assessment.indicators.map((i) => i.description).join(' ')} Recommended: ${assessment.daysUntilNextSession} day${assessment.daysUntilNextSession > 1 ? 's' : ''} rest.`,
		actionRequired: priority !== 'info',
		actionText,
		timestamp: new Date(),
		dismissible: false,
		metadata: {
			fatigueScore: assessment.fatigueScore,
			recommendedAction: assessment.recommendedAction,
			daysRest: assessment.daysUntilNextSession
		}
	};
}

/**
 * Generate alert from injury risk assessment
 */
export function generateInjuryRiskAlert(assessment: InjuryRiskAssessment): Alert | null {
	if (assessment.riskLevel === 'low') return null; // No alert needed

	const priority: AlertPriority =
		assessment.riskLevel === 'critical'
			? 'critical'
			: assessment.riskLevel === 'high'
				? 'critical'
				: 'warning';

	const title =
		assessment.riskLevel === 'critical'
			? '🛑 CRITICAL: Injury Risk'
			: assessment.riskLevel === 'high'
				? '🚨 High Injury Risk'
				: '⚠️ Moderate Injury Risk';

	return {
		id: `injury-risk-${Date.now()}`,
		type: 'injury_risk',
		priority,
		title,
		message:
			assessment.immediateAction ||
			`Injury risk factors detected: ${assessment.factors.map((f) => f.factor).join(', ')}`,
		actionRequired: true,
		actionText: assessment.riskLevel === 'critical' ? 'View Safety Plan' : 'Review Risk Factors',
		timestamp: new Date(),
		dismissible: false,
		metadata: {
			riskLevel: assessment.riskLevel,
			riskScore: assessment.riskScore,
			factorCount: assessment.factors.length
		}
	};
}

/**
 * Consolidate all alerts and prioritize
 */
export function consolidateAlerts(
	anomalies: PerformanceAnomaly[],
	fatigueAssessment: FatigueAssessment | null,
	injuryRiskAssessment: InjuryRiskAssessment | null
): AlertSummary {
	const alerts: Alert[] = [];

	// Add anomaly alerts
	if (anomalies.length > 0) {
		alerts.push(...generateAnomalyAlerts(anomalies));
	}

	// Add fatigue alert
	if (fatigueAssessment) {
		const fatigueAlert = generateFatigueAlert(fatigueAssessment);
		if (fatigueAlert) alerts.push(fatigueAlert);
	}

	// Add injury risk alert
	if (injuryRiskAssessment) {
		const injuryAlert = generateInjuryRiskAlert(injuryRiskAssessment);
		if (injuryAlert) alerts.push(injuryAlert);
	}

	// Sort by priority (critical first)
	const sortedAlerts = alerts.sort((a, b) => {
		const priorityOrder = { critical: 3, warning: 2, info: 1 };
		return priorityOrder[b.priority] - priorityOrder[a.priority];
	});

	// Count by priority
	const critical = alerts.filter((a) => a.priority === 'critical').length;
	const warning = alerts.filter((a) => a.priority === 'warning').length;
	const info = alerts.filter((a) => a.priority === 'info').length;

	return {
		total: alerts.length,
		critical,
		warning,
		info,
		alerts: sortedAlerts
	};
}

/**
 * Get alert title from anomaly type
 */
function getAnomalyTitle(type: PerformanceAnomaly['type']): string {
	switch (type) {
		case 'performance_drop':
			return '📉 Performance Drop Detected';
		case 'performance_spike':
			return '📈 Performance Spike';
		case 'sudden_change':
			return '⚡ Sudden Change';
		case 'unusual_variability':
			return '📊 High Variability';
		default:
			return '⚠️ Performance Alert';
	}
}

/**
 * Filter alerts by priority for display
 */
export function filterAlertsByPriority(alerts: Alert[], minPriority: AlertPriority): Alert[] {
	const priorityOrder = { critical: 3, warning: 2, info: 1 };
	const minLevel = priorityOrder[minPriority];

	return alerts.filter((a) => priorityOrder[a.priority] >= minLevel);
}

/**
 * Get most critical alert for banner display
 */
export function getMostCriticalAlert(alerts: Alert[]): Alert | null {
	const critical = alerts.filter((a) => a.priority === 'critical');
	if (critical.length > 0) return critical[0];

	const warnings = alerts.filter((a) => a.priority === 'warning');
	if (warnings.length > 0) return warnings[0];

	return alerts.length > 0 ? alerts[0] : null;
}

/**
 * Format alert for display
 */
export function formatAlertMessage(alert: Alert, includeAction: boolean = true): string {
	let message = `${alert.title}\n${alert.message}`;

	if (includeAction && alert.actionRequired && alert.actionText) {
		message += `\n\nAction: ${alert.actionText}`;
	}

	return message;
}

/**
 * Get alert icon/emoji based on type and priority
 */
export function getAlertIcon(alert: Alert): string {
	if (alert.priority === 'critical') return '🚨';
	if (alert.priority === 'warning') return '⚠️';

	switch (alert.type) {
		case 'anomaly':
			return '📊';
		case 'fatigue':
			return '😴';
		case 'injury_risk':
			return '🏥';
		case 'goal_adjustment':
			return '🎯';
		case 'achievement':
			return '🎉';
		default:
			return '💡';
	}
}

/**
 * Get alert color for UI styling
 */
export function getAlertColor(alert: Alert): string {
	switch (alert.priority) {
		case 'critical':
			return '#ff4444'; // Red
		case 'warning':
			return '#f5a623'; // Amber
		case 'info':
			return '#3de8c8'; // Teal
	}
}

/**
 * Check if user should be blocked from training
 */
export function shouldBlockTraining(alerts: Alert[]): boolean {
	return alerts.some(
		(a) => a.priority === 'critical' && (a.type === 'injury_risk' || a.type === 'fatigue')
	);
}

/**
 * Generate notification text for push/email
 */
export function generateNotificationText(alert: Alert): {
	title: string;
	body: string;
} {
	return {
		title: alert.title,
		body: alert.message.length > 100 ? alert.message.substring(0, 97) + '...' : alert.message
	};
}

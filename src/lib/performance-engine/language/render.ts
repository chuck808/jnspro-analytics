/**
 * v8.3 Controlled Language System - Render
 *
 * Functions to render coach messages
 */

import type { CoachMessage, TrustContext } from './types';

/**
 * Render a complete coach message with formatting
 */
export function renderCoachMessage(message: CoachMessage, trust: TrustContext): string {
	const parts: string[] = [];

	// Header with run count
	parts.push(`[Based on ${trust.basedOnRuns} run${trust.basedOnRuns !== 1 ? 's' : ''}]`);
	parts.push('');

	// Headline
	parts.push(`## ${message.headline}`);
	parts.push('');

	// Impact
	parts.push(`**Impact:** ${message.impact}`);
	parts.push('');

	// Why this matters
	parts.push(`**Why this matters:** ${message.whyThisMatters}`);
	parts.push('');

	// Action
	parts.push(`💡 ${message.action}`);
	parts.push('');

	// Watch for (if provided)
	if (message.watchFor) {
		parts.push(`👁️ **Watch for:** ${message.watchFor}`);
		parts.push('');
	}

	// Trust indicators
	if (trust.blockedMetrics.length > 0) {
		parts.push(`⚠️ **Blocked metrics:** ${trust.blockedMetrics.join(', ')}`);
	}
	if (trust.cautionMetrics.length > 0) {
		parts.push(`⚡ **Use with caution:** ${trust.cautionMetrics.join(', ')}`);
	}

	return parts.join('\n');
}

/**
 * Render trust context as a simple summary
 */
export function renderTrustSummary(trust: TrustContext): string {
	const parts: string[] = [];

	if (trust.trustedMetrics.length > 0) {
		parts.push(`✓ Trusted: ${trust.trustedMetrics.join(', ')}`);
	}

	if (trust.cautionMetrics.length > 0) {
		parts.push(`⚡ Caution: ${trust.cautionMetrics.join(', ')}`);
	}

	if (trust.blockedMetrics.length > 0) {
		parts.push(`✗ Blocked: ${trust.blockedMetrics.join(', ')}`);
	}

	return parts.join(' • ');
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: 'critical' | 'important' | 'watch' | 'info'): string {
	switch (priority) {
		case 'critical':
			return '#ff4444';
		case 'important':
			return '#f5a623';
		case 'watch':
			return '#ffcc44';
		case 'info':
			return '#3de8c8';
	}
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: 'low' | 'moderate' | 'high'): string {
	switch (confidence) {
		case 'low':
			return '#ffcc44';
		case 'moderate':
			return '#f5a623';
		case 'high':
			return '#3de8c8';
	}
}

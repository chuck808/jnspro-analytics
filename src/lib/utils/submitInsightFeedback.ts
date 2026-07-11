import type { FeedbackResponse } from '$lib/performance-feedback/types';

interface FeedbackOptions {
	insightType: string;
	content: string;
	response: FeedbackResponse;
	detailLevel?: 'grom' | 'rider' | 'elite' | 'coach';
	sessionId?: string;
	context?: Record<string, any>;
	comment?: string;
}

/**
 * Submit insight feedback to the API
 *
 * @param options - Feedback data
 * @returns Success status and feedback ID
 */
export async function submitInsightFeedback(options: FeedbackOptions): Promise<{
	success: boolean;
	feedbackId?: string;
	error?: string;
}> {
	try {
		const response = await fetch('/api/feedback/insights', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				insightType: options.insightType,
				content: options.content,
				response: options.response,
				detailLevel: options.detailLevel,
				sessionId: options.sessionId,
				context: options.context,
				comment: options.comment,
				timestamp: new Date().toISOString()
			})
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Feedback submission failed:', result);
			return {
				success: false,
				error: result.error || 'Failed to submit feedback'
			};
		}

		return {
			success: true,
			feedbackId: result.feedbackId
		};
	} catch (error) {
		console.error('Error submitting feedback:', error);
		return {
			success: false,
			error: 'Network error. Please try again.'
		};
	}
}

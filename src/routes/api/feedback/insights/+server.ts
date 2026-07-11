import { json, type RequestHandler } from '@sveltejs/kit';
import type { InsightFeedbackPayload } from '$lib/performance-feedback';

/**
 * POST /api/feedback/insights
 * 
 * Receives and stores user feedback on performance insights
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const payload: InsightFeedbackPayload = await request.json();

    // Validate required fields
    if (!payload.insightType || !payload.content || !payload.response) {
      return json(
        { error: 'Missing required fields: insightType, content, response' },
        { status: 400 }
      );
    }

    // Validate response type
    const validResponses = ['useful', 'not-useful', 'confusing', 'ignored'];
    if (!validResponses.includes(payload.response)) {
      return json(
        { error: 'Invalid response type. Must be: useful, not-useful, confusing, or ignored' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional - feedback can be anonymous)
    const { data: { user } } = await locals.supabase.auth.getUser();
    
    // Store feedback in database
    const { data, error } = await locals.supabase
      .from('insight_feedback')
      .insert({
        insight_type: payload.insightType,
        content: payload.content,
        response: payload.response,
        detail_level: payload.detailLevel || null,
        // Derived from the authenticated session, never the client payload —
        // otherwise any caller could attribute feedback to an arbitrary rider.
        rider_id: user?.id ?? null,
        session_id: payload.sessionId || null,
        context: payload.context || {},
        comment: payload.comment || null,
        timestamp: payload.timestamp || new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error saving feedback:', error);
      return json(
        { error: 'Failed to save feedback', details: error.message },
        { status: 500 }
      );
    }

    // Return success
    return json({
      success: true,
      feedbackId: data.id,
      message: 'Feedback received successfully'
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

-- Create insight_feedback table for performance insight quality tracking
-- Part of Performance Engine v8.1 - Feedback Loop
-- See: PERFORMANCE_ENGINE_V8.1_README.md

CREATE TABLE IF NOT EXISTS insight_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What insight was shown
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'cross-session-headline',
        'cross-session-recommendation', 
        'cross-session-warning',
        'session-intelligence',
        'session-recommendation',
        'technique-score',
        'fatigue-warning',
        'drop-off-alert',
        'repeatability-insight',
        'best-vs-avg-insight'
    )),
    content TEXT NOT NULL,
    
    -- User response
    response TEXT NOT NULL CHECK (response IN ('useful', 'not-useful', 'confusing', 'ignored')),
    
    -- Context
    detail_level TEXT CHECK (detail_level IN ('grom', 'rider', 'elite', 'coach')),
    rider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- Additional metadata
    context JSONB DEFAULT '{}',
    comment TEXT,
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_insight_feedback_insight_type ON insight_feedback(insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_response ON insight_feedback(response);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_detail_level ON insight_feedback(detail_level);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_rider_id ON insight_feedback(rider_id);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_timestamp ON insight_feedback(timestamp DESC);

-- Composite index for common analytics queries
CREATE INDEX IF NOT EXISTS idx_insight_feedback_analytics 
    ON insight_feedback(insight_type, response, timestamp DESC);

-- Enable RLS
ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can submit insight feedback"
    ON insight_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = rider_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own insight feedback"
    ON insight_feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = rider_id);

-- Policy: Admins can view all insight feedback
CREATE POLICY "Admins can view all insight feedback"
    ON insight_feedback
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can delete insight feedback (for cleanup/privacy)
CREATE POLICY "Admins can delete insight feedback"
    ON insight_feedback
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON insight_feedback TO authenticated;
GRANT DELETE ON insight_feedback TO authenticated; -- Admins only via RLS

-- Create view for admin analytics (pre-aggregated common queries)
CREATE OR REPLACE VIEW insight_feedback_summary AS
SELECT 
    insight_type,
    COUNT(*) as total_responses,
    COUNT(*) FILTER (WHERE response = 'useful') as useful_count,
    COUNT(*) FILTER (WHERE response = 'not-useful') as not_useful_count,
    COUNT(*) FILTER (WHERE response = 'confusing') as confusing_count,
    COUNT(*) FILTER (WHERE response = 'ignored') as ignored_count,
    ROUND(
        COUNT(*) FILTER (WHERE response = 'useful')::NUMERIC / 
        NULLIF(COUNT(*), 0)::NUMERIC * 100, 
        2
    ) as usefulness_percent,
    MIN(timestamp) as first_feedback,
    MAX(timestamp) as last_feedback
FROM insight_feedback
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY insight_type
ORDER BY total_responses DESC;

-- Grant view access to authenticated users with admin role
GRANT SELECT ON insight_feedback_summary TO authenticated;

-- Add helpful comment
COMMENT ON TABLE insight_feedback IS 'Tracks user feedback on performance insights to measure usefulness and identify confusing messaging. Part of Performance Engine v8.1.';
COMMENT ON COLUMN insight_feedback.insight_type IS 'Category of insight: headline, recommendation, warning, etc.';
COMMENT ON COLUMN insight_feedback.content IS 'The actual text that was shown to the user';
COMMENT ON COLUMN insight_feedback.response IS 'User response: useful, not-useful, confusing, or ignored';
COMMENT ON COLUMN insight_feedback.detail_level IS 'User experience level when feedback was given';
COMMENT ON COLUMN insight_feedback.context IS 'Additional metadata: trend direction, confidence level, metric values, etc.';
COMMENT ON COLUMN insight_feedback.timestamp IS 'When the insight was shown (not when feedback was submitted)';

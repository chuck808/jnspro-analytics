-- Add contextual metadata fields to sessions table
-- These fields capture important environmental and operational context

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS weather_conditions TEXT,
ADD COLUMN IF NOT EXISTS track_surface TEXT,
ADD COLUMN IF NOT EXISTS session_focus TEXT;

-- Add comments for documentation
COMMENT ON COLUMN sessions.weather_conditions IS 'Weather during session (e.g., sunny, cloudy, rainy, windy)';
COMMENT ON COLUMN sessions.track_surface IS 'Track surface condition (e.g., dry, damp, wet, muddy)';
COMMENT ON COLUMN sessions.session_focus IS 'Primary focus or goal of the session (e.g., reaction time, explosiveness, endurance, technique)';

-- Create index for filtering sessions by focus
CREATE INDEX IF NOT EXISTS idx_sessions_focus ON sessions(session_focus) WHERE session_focus IS NOT NULL;

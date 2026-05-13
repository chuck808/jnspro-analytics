-- =====================================================
-- Session Notes System
-- Enhanced collaboration features for rider/coach notes
-- =====================================================

-- Create session_notes table
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    note_type VARCHAR(20) NOT NULL CHECK (note_type IN ('pre', 'during', 'post', 'coach')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    author_role VARCHAR(20) CHECK (author_role IN ('rider', 'parent', 'coach')),
    
    CONSTRAINT session_notes_session_fkey 
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    CONSTRAINT session_notes_user_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_type ON session_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_session_notes_user ON session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_created ON session_notes(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE session_notes IS 'Session notes for collaboration between riders, parents, and coaches';
COMMENT ON COLUMN session_notes.note_type IS 'Type of note: pre (before session), during (observations), post (reflections), coach (coaching feedback)';
COMMENT ON COLUMN session_notes.author_role IS 'Role of the person who wrote the note';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_session_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_notes_updated_at
    BEFORE UPDATE ON session_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_session_notes_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Users can view notes for their own sessions
CREATE POLICY "Users can view their own session notes"
    ON session_notes FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM sessions WHERE user_id = auth.uid()
        )
    );

-- Users can insert notes for their own sessions
CREATE POLICY "Users can create notes for their own sessions"
    ON session_notes FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM sessions WHERE user_id = auth.uid()
        )
    );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes"
    ON session_notes FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
    ON session_notes FOR DELETE
    USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON session_notes TO authenticated;
-- Note: No sequence needed - using gen_random_uuid() for primary key

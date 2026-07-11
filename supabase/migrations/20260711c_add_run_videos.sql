-- Run Videos Feature
-- Description: Adds optional per-run video attachment (see VIDEO_SYNC_DESIGN.md).
-- Foundation slice only: storage, schema, plain playback. No sync detection,
-- no HUD data — thumbnail_path and sync_offset_s are reserved for later work.

-- ============================================================================
-- RUN_VIDEOS TABLE
-- ============================================================================
-- One video per run (arm→beam-break bracketing produces a single discrete
-- clip per gate, not one long session recording — see VIDEO_SYNC_DESIGN.md §3.4)

CREATE TABLE IF NOT EXISTS public.run_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,

    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    duration_ms INTEGER, -- nullable; best-effort browser extraction, not always available

    thumbnail_path TEXT, -- nullable; reserved, not computed in the foundation pass
    sync_offset_s REAL, -- nullable; reserved for flash-frame sync detection (VIDEO_SYNC_DESIGN.md §4)

    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'processing', 'failed')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(run_id)
);

CREATE INDEX IF NOT EXISTS idx_run_videos_run_id ON public.run_videos(run_id);

-- RLS Policies (inherit from runs -> sessions, identical pattern to gate_runs/run_timeseries)
ALTER TABLE public.run_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view videos for their sessions"
    ON public.run_videos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_videos.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert videos for their sessions"
    ON public.run_videos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_videos.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update videos for their sessions"
    ON public.run_videos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_videos.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete videos for their sessions"
    ON public.run_videos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_videos.run_id
            AND sessions.user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.run_videos IS 'Optional per-run video attachment, one clip per run (see VIDEO_SYNC_DESIGN.md)';
COMMENT ON COLUMN public.run_videos.sync_offset_s IS 'Reserved for flash-frame sync detection (not yet implemented)';
COMMENT ON COLUMN public.run_videos.thumbnail_path IS 'Reserved for a poster-frame thumbnail (not yet implemented)';

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================
-- Bucket name: run-videos
-- Public: false (authenticated access only, served via signed URLs)
-- File size limit: 200MB
-- Allowed MIME types: video/mp4, video/quicktime
--
-- Path convention: run-videos/{user_id}/{run_id}/{filename} — only the first
-- path segment matters for RLS, the run_id segment just keeps objects grouped.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'run-videos',
    'run-videos',
    false,
    209715200, -- 200MB
    ARRAY['video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can upload their own run videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'run-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own run videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'run-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own run videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'run-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own run videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'run-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

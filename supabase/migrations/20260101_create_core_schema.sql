-- Core Database Schema for AppGatePro Analytics
-- Created: 2026-01-01
-- Schema Version: 2
-- 
-- This migration creates the foundational tables for session data storage.
-- All data stored in SI units (m/s for speeds, degrees for angles, ms for times).
-- chartData stored as float arrays in G-units (converted from int16×100 at ingestion).

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
-- Stores session metadata and associates with user, bike, and rider profile

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('gate', 'track', 'training')),
    timestamp TIMESTAMPTZ NOT NULL,
    bike_id UUID REFERENCES public.bikes(id) ON DELETE SET NULL,
    rider_profile_id UUID REFERENCES public.rider_profiles(id) ON DELETE SET NULL,
    notes TEXT DEFAULT '',
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON public.sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_timestamp ON public.sessions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_archived ON public.sessions(archived) WHERE archived = false;

-- RLS Policies
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
    ON public.sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON public.sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON public.sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON public.sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- RUNS TABLE
-- ============================================================================
-- Stores base run data including acceleration trace (chart_data)

CREATE TABLE IF NOT EXISTS public.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    run_number INTEGER NOT NULL,
    elapsed_time_ms INTEGER,
    distance_m REAL,
    chart_data JSONB, -- Array of float G-units (converted from int16×100)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, run_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_runs_session_id ON public.runs(session_id);
CREATE INDEX IF NOT EXISTS idx_runs_session_run ON public.runs(session_id, run_number);

-- RLS Policies (inherit from sessions)
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runs for their sessions"
    ON public.runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = runs.session_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert runs for their sessions"
    ON public.runs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = runs.session_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update runs for their sessions"
    ON public.runs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = runs.session_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete runs for their sessions"
    ON public.runs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = runs.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- ============================================================================
-- GATE_RUNS TABLE
-- ============================================================================
-- Stores gate-specific analytics (typed run data)
-- All firmware analytics values stored in display-ready units

CREATE TABLE IF NOT EXISTS public.gate_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
    
    -- Core metrics
    reaction_time_ms INTEGER,
    max_g REAL NOT NULL,
    avg_g REAL NOT NULL,
    
    -- Speed analytics (all in m/s)
    speed_ms REAL, -- end speed
    peak_speed_ms REAL,
    avg_speed_ms_calc REAL,
    time_to_peak_speed_ms INTEGER,
    bias_correction_ms2 REAL,
    analytics_valid BOOLEAN DEFAULT FALSE,
    
    -- Pitch/wheelie analytics (all in degrees)
    max_pitch_deg REAL,
    avg_pitch_deg REAL,
    pitch_at_peak_g_deg REAL,
    time_to_wheelie_ms INTEGER,
    wheelie_duration_ms INTEGER,
    front_wheel_lifted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(run_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_runs_run_id ON public.gate_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_gate_runs_analytics_valid ON public.gate_runs(analytics_valid) WHERE analytics_valid = true;

-- RLS Policies (inherit from runs -> sessions)
ALTER TABLE public.gate_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gate_runs for their sessions"
    ON public.gate_runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = gate_runs.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert gate_runs for their sessions"
    ON public.gate_runs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = gate_runs.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update gate_runs for their sessions"
    ON public.gate_runs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = gate_runs.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete gate_runs for their sessions"
    ON public.gate_runs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = gate_runs.run_id
            AND sessions.user_id = auth.uid()
        )
    );

-- ============================================================================
-- RUN_TIMESERIES TABLE
-- ============================================================================
-- Stores optional high-frequency sensor data
-- All angles in degrees, all accelerations in G-units

CREATE TABLE IF NOT EXISTS public.run_timeseries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
    
    sample_rate_hz INTEGER NOT NULL,
    sample_count INTEGER NOT NULL,
    
    -- Sensor arrays (all float arrays)
    g_force_data JSONB, -- float[] G-units
    pitch_deg JSONB, -- float[] degrees (converted from radians)
    roll_deg JSONB, -- float[] degrees (converted from radians)
    linear_accel_g JSONB, -- float[] G-units
    raw_accel_g JSONB, -- float[] G-units
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(run_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_run_timeseries_run_id ON public.run_timeseries(run_id);

-- RLS Policies (inherit from runs -> sessions)
ALTER TABLE public.run_timeseries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeseries for their sessions"
    ON public.run_timeseries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_timeseries.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert timeseries for their sessions"
    ON public.run_timeseries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_timeseries.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update timeseries for their sessions"
    ON public.run_timeseries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_timeseries.run_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete timeseries for their sessions"
    ON public.run_timeseries FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.sessions ON sessions.id = runs.session_id
            WHERE runs.id = run_timeseries.run_id
            AND sessions.user_id = auth.uid()
        )
    );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Automatically update updated_at timestamp on sessions table

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.sessions IS 'Session metadata - links user, bike, and rider profile to a training session';
COMMENT ON TABLE public.runs IS 'Base run data including acceleration trace (chart_data stored as float[] G-units)';
COMMENT ON TABLE public.gate_runs IS 'Gate-specific analytics - speeds in m/s, angles in degrees';
COMMENT ON TABLE public.run_timeseries IS 'Optional high-frequency sensor data - angles in degrees, accelerations in G-units';

COMMENT ON COLUMN public.runs.chart_data IS 'Acceleration trace as float[] in G-units (converted from int16×100 at ingestion)';
COMMENT ON COLUMN public.gate_runs.speed_ms IS 'End speed in meters per second';
COMMENT ON COLUMN public.gate_runs.peak_speed_ms IS 'Peak speed in meters per second';
COMMENT ON COLUMN public.gate_runs.bias_correction_ms2 IS 'Bias correction applied to integration in m/s²';
COMMENT ON COLUMN public.gate_runs.analytics_valid IS 'True if firmware analytics passed validation';
COMMENT ON COLUMN public.run_timeseries.pitch_deg IS 'Pitch angle array in degrees (converted from radians at ingestion)';
COMMENT ON COLUMN public.run_timeseries.roll_deg IS 'Roll angle array in degrees (converted from radians at ingestion)';

-- Migration: Add Leaderboard System Columns
-- Description: Adds privacy-preserving leaderboard functionality to user_preferences
-- Date: 2026-04-28

-- Add leaderboard columns to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS leaderboard_display_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.user_preferences.show_on_leaderboard IS 'User opt-in for appearing on public leaderboards (privacy-preserving)';
COMMENT ON COLUMN public.user_preferences.leaderboard_display_name IS 'Anonymous display name shown on leaderboards (null = auto-generated)';

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_leaderboard 
ON public.user_preferences(show_on_leaderboard) 
WHERE show_on_leaderboard = true;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_preferences'
  AND column_name IN ('show_on_leaderboard', 'leaderboard_display_name');

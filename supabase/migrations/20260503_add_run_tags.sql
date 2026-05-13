-- Migration: Add tags column to runs table for run categorization
-- Purpose: Enable users to tag runs (warmup, best-effort, experimental, etc.) 
--          and exclude certain runs from session statistics
-- Date: 2026-05-03

-- Add tags column to runs table
ALTER TABLE runs 
ADD COLUMN tags TEXT[] DEFAULT NULL;

-- Create GIN index for efficient tag queries
CREATE INDEX idx_runs_tags ON runs USING GIN(tags);

-- Add comment for documentation
COMMENT ON COLUMN runs.tags IS 
'Array of run tags for categorization. Possible values: warmup, best-effort, experimental, competition, exclude-from-stats';

-- Migration notes:
-- 1. All existing runs will have tags = null (valid state)
-- 2. No data migration needed
-- 3. Application will filter runs with exclude-from-stats tag when calculating session statistics

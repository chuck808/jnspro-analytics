-- Add ride_feel column to sessions table
-- This captures subjective rider feedback on how the session felt

ALTER TABLE sessions 
ADD COLUMN ride_feel TEXT CHECK (
    ride_feel IN ('off', 'solid', 'good', 'dialled', 'peak')
);

COMMENT ON COLUMN sessions.ride_feel IS 'Subjective rider assessment of session quality: off, solid, good, dialled, or peak';

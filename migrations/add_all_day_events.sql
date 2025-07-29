-- Add is_all_day column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT FALSE;

-- Update existing events to set is_all_day = false
UPDATE events SET is_all_day = FALSE WHERE is_all_day IS NULL;
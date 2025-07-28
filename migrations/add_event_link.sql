-- Add link field to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS link VARCHAR(500);
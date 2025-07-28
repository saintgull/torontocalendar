-- Add color field to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS color VARCHAR(7);
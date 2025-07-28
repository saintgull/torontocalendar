-- Add recurring event support to the events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_rule VARCHAR(255),
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS parent_event_id INTEGER REFERENCES events(id) ON DELETE CASCADE;

-- Create index for faster lookup of child events
CREATE INDEX IF NOT EXISTS idx_events_parent_id ON events(parent_event_id);

-- Add comment to explain the columns
COMMENT ON COLUMN events.is_recurring IS 'Whether this is a recurring event';
COMMENT ON COLUMN events.recurrence_rule IS 'Recurrence pattern: daily, weekly, monthly, yearly with additional parameters';
COMMENT ON COLUMN events.recurrence_end_date IS 'When the recurrence ends';
COMMENT ON COLUMN events.parent_event_id IS 'Reference to the original recurring event (null for parent events)';
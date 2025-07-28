-- Add link field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS link VARCHAR(500);
-- Add password reset token columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token UUID,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
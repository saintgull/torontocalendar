-- Drop the redundant password_set column
-- We can just check if password_hash IS NOT NULL instead
ALTER TABLE users DROP COLUMN IF EXISTS password_set;
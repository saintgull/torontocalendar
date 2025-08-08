-- Remove redundant password_set column
-- We can just check if password_hash is not null instead

ALTER TABLE users DROP COLUMN IF EXISTS password_set;
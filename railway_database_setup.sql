-- Toronto Calendar - Complete Database Setup for Railway PostgreSQL
-- Run this script in Beekeeper Studio after connecting to your Railway database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  created_events_count INTEGER DEFAULT 0,
  invite_token VARCHAR(255) UNIQUE,
  invite_expires_at TIMESTAMP,
  password_set BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS link VARCHAR(500);

-- Events table with all features
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  end_date DATE,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER,
  creator_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to events table if they don't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent_event_id INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS link VARCHAR(500);
ALTER TABLE events ADD COLUMN IF NOT EXISTS color VARCHAR(7);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_events_created_by') THEN
        ALTER TABLE events ADD CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_events_parent') THEN
        ALTER TABLE events ADD CONSTRAINT fk_events_parent FOREIGN KEY (parent_event_id) REFERENCES events(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sessions_user') THEN
        ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END
$$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_parent_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_invite_token ON users(invite_token);

-- Insert admin user for testing (only if doesn't exist)
INSERT INTO users (email, display_name, password_set, created_at)
VALUES ('admin@torontoevents.live', 'Admin User', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;
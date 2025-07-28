-- Toronto Calendar - Complete Database Setup for Railway PostgreSQL
-- Run this script in Beekeeper Studio after connecting to your Railway database

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  created_events_count INTEGER DEFAULT 0,
  invite_token VARCHAR(255) UNIQUE,
  invite_expires_at TIMESTAMP,
  password_set BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  link VARCHAR(500)
);

-- Events table with all features
CREATE TABLE events (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(255),
  recurrence_end_date DATE,
  parent_event_id INTEGER,
  link VARCHAR(500),
  color VARCHAR(7)
);

-- Sessions table
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints after tables are created
ALTER TABLE events ADD CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE events ADD CONSTRAINT fk_events_parent FOREIGN KEY (parent_event_id) REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_parent_id ON events(parent_event_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_invite_token ON users(invite_token);

-- Insert admin user for testing
INSERT INTO users (email, display_name, password_set, created_at)
VALUES ('admin@torontoevents.live', 'Admin User', TRUE, CURRENT_TIMESTAMP);
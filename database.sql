-- Create database
CREATE DATABASE tocalendar;

-- Connect to the database
\c tocalendar;

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table  
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  end_date DATE,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  creator_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_invite_token ON users(invite_token);

-- Clean up expired sessions (you can run this periodically)
-- DELETE FROM sessions WHERE expires_at < NOW();
-- Create table for event submissions when email isn't working
CREATE TABLE IF NOT EXISTS event_submissions (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    submitter_name VARCHAR(100) NOT NULL,
    submitter_email VARCHAR(255),
    event_link TEXT,
    event_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);
--
-- The goal of this file is to contain complete instructions for an initial
-- creation of a database.
--

-- Function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Member
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

CREATE TABLE IF NOT EXISTS member_type (
    id SERIAL PRIMARY KEY,
    member_type TEXT UNIQUE NOT NULL
);

INSERT INTO member_type (member_type) VALUES ('student'), ('working'), ('senior');

CREATE TABLE IF NOT EXISTS member (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT,
    salt TEXT,
    role TEXT,
    reset_validity TIMESTAMPTZ,
    reset_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    location TEXT,
    education TEXT,
    profession TEXT,
    member_type_id INTEGER REFERENCES member_type (id) ON DELETE SET NULL ON UPDATE CASCADE,
    gender gender DEFAULT 'other',
    year_of_birth INTEGER,
    expiration_date TIMESTAMPTZ
);

CREATE TRIGGER update_member
BEFORE UPDATE ON member
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Setting
CREATE TABLE setting (
    key TEXT PRIMARY KEY UNIQUE NOT NULL,
    value TEXT NOT NULL, 
    description TEXT
);

-- Ewb Error
CREATE TABLE ewb_error (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    origin TEXT NOT NULL,
    params JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outgoing Message
CREATE TABLE outgoing_message (
    id SERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    sender TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    send_at TIMESTAMPTZ DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0
);

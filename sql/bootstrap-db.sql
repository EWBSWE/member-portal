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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    send_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0
);

-- Payment
CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES member (id) ON DELETE CASCADE ON UPDATE CASCADE,
    amount INTEGER NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'SEK',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Product
CREATE TABLE product_type (
    id SERIAL PRIMARY KEY,
    identifier TEXT UNIQUE NOT NULL
);

CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL CONSTRAINT positive_price CHECK (price > 0),
    description TEXT,
    product_type_id INTEGER REFERENCES product_type(id) ON DELETE SET NULL ON UPDATE CASCADE,
    currency_code TEXT NOT NULL DEFAULT 'SEK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_product
BEFORE UPDATE ON product
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- Email template
CREATE TABLE email_template (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
);

-- Event
CREATE TABLE event_addon (
    id SERIAL PRIMARY KEY,
    capacity INTEGER NOT NULL,
    product_id INTEGER REFERENCES product (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE event (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    identifier TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    email_template_id INTEGER REFERENCES email_template(id) ON DELETE SET NULL ON UPDATE CASCADE,
    notification_open BOOLEAN NOT NULL DEFAULT TRUE,
);

CREATE TABLE event_subscribers (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE ON UPDATE CASCADE,
    member_id INTEGER REFERENCES member(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE event_participants (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE ON UPDATE CASCADE,
    member_id INTEGER REFERENCES member(id) ON DELETE CASCADE ON UPDATE CASCADE,
    message TEXT
);

CREATE TABLE event_payments (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE ON UPDATE CASCADE,
    payment_id INTEGER REFERENCES payment(id) ON DELETE CASCADE ON UPDATE CASCADE
);

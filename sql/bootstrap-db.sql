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
    gender gender,
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

INSERT INTO setting (key, value, description)
VALUES
('StripeTransactionFeePercent', '0.014', 'Percentage of total transaction amount applied to each purchase.'),
('StripeTransactionFeeFlat', '1.8', 'Flat fee applied on each purchase');

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
    member_id INTEGER REFERENCES member (id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
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
    product_type_id INTEGER REFERENCES product_type(id) ON DELETE SET NULL ON UPDATE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL CONSTRAINT positive_price CHECK (price >= 0),
    description TEXT,
    attribute JSONB DEFAULT NULL,
    currency_code TEXT NOT NULL DEFAULT 'SEK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_product
BEFORE UPDATE ON product
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TABLE payment_product (
    payment_id INTEGER REFERENCES payment(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    product_id INTEGER REFERENCES product(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL
);


-- Email template
CREATE TABLE email_template (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL
);

-- Event
CREATE TABLE event (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    identifier TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    email_template_id INTEGER REFERENCES email_template(id) ON DELETE SET NULL ON UPDATE CASCADE,
    notification_open BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE event_product (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES event (id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    capacity INTEGER NOT NULL CONSTRAINT positive_capacity CHECK (capacity >= 0),
    product_id INTEGER REFERENCES product (id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL
);

CREATE TABLE event_subscriber (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    member_id INTEGER REFERENCES member(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL
);

CREATE TABLE event_participant (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    member_id INTEGER REFERENCES member(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL
);

CREATE TABLE event_payment (
    event_id INTEGER REFERENCES event(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    payment_id INTEGER REFERENCES payment(id) ON DELETE CASCADE ON UPDATE CASCADE NOT NULL,
    message TEXT
);


CREATE TABLE member (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL,
    reset_validity TIMESTAMP,
    reset_token TEXT
);

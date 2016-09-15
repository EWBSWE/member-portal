CREATE TABLE ewb_error (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    origin TEXT NOT NULL,
    params JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

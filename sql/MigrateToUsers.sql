UPDATE member
SET role = 'user'
WHERE hashed_password IS NOT NULL AND role IS NULL

INSERT INTO ewb_user (username, hashed_password, salt, role, created_at, updated_at, reset_token, reset_validity)
SELECT email, hashed_password, salt, role, created_at, updated_at, reset_token, reset_validity
FROM member
WHERE hashed_password IS NOT NULL

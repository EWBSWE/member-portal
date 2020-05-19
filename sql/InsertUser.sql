INSERT INTO ewb_user (username, hashed_password, salt, role, reset_token)
VALUES ($1, $2, $3, $4, $5)
RETURNING id

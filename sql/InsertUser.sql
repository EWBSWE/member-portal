INSERT INTO ewb_user (username, hashed_password, salt, role)
VALUES ($1, $2, $3, $4)
RETURNING id

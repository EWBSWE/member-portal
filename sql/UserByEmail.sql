SELECT id, username, hashed_password, salt, role, reset_token, reset_validity
FROM ewb_user
WHERE username = $1

SELECT id, username, hashed_password, salt, role
FROM ewb_user
WHERE id = $1

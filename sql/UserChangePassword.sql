UPDATE ewb_user
SET
    hashed_password = $2,
    salt = $3
WHERE id = $1

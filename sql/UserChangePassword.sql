UPDATE ewb_user
SET
    reset_validity = NOW() + '15 minutes'::interval,
    reset_token = $2
WHERE id = $1
RETURNING reset_token

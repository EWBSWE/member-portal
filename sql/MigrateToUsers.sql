UPDATE member
SET role = 'user'
WHERE
    hashed_password IS NOT NULL AND
    role IS NULL

INSERT INTO ewb_user (username, hashed_password, salt, role, created_at, updated_at, reset_token, reset_validity)
SELECT
    member.email,
    member.hashed_password,
    member.salt,
    member.role,
    member.created_at,
    member.updated_at,
    member.reset_token,
    member.reset_validity
FROM member
JOIN ewb_user ON ewb_user.username = member.email
WHERE
    member.hashed_password IS NOT NULL AND
    ewb_user.username != member.email


ALTER TABLE member
DROP COLUMN hashed_password,
DROP COLUMN salt,
DROP COLUMN role,
DROP COLUMN reset_validity,
DROP COLUMN reset_token

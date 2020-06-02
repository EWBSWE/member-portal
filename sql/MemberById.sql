SELECT
    member.id,
    email,
    name,
    location,
    education,
    profession,
    member_type,
    gender,
    year_of_birth,
    created_at,
    expiration_date,
    employer
FROM member
LEFT JOIN member_type ON (member.member_type_id = member_type.id)
WHERE member.id = $1

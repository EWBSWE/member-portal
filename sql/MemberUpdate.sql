UPDATE member
SET
    name = $2,
    location = $3,
    education = $4,
    profession = $5,
    member_type_id = (SELECT id FROM member_type WHERE member_type = $6),
    expiration_date = $7,
    chapter_id = $8,
    employer = $9,
    year_of_birth = $10
WHERE id = $1

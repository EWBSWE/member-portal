INSERT INTO member (
    email,
    location,
    name,
    education,
    profession,
    member_type_id,
    expiration_date,
    chapter_id,
    employer,
    year_of_birth
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id

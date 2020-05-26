UPDATE product
SET
    name = $2,
    price = $3,
    description = $4
WHERE
    id = $1

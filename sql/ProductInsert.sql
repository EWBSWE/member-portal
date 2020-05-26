INSERT INTO product (name, description, price, product_type_id)
VALUES ($1, $2, $3, $4)
RETURNING *

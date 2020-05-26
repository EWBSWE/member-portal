INSERT INTO event_product (event_id, capacity, product_id)
VALUES ($1, $2, $3)
RETURNING *

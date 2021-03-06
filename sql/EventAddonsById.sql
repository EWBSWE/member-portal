SELECT
    event_product.id,
    product_id,
    product.name,
    product.price,
    capacity,
    product.description
FROM event_product
JOIN product ON product.id = event_product.product_id
WHERE event_id = $1
ORDER BY product.id

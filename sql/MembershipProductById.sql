SELECT *
FROM product
WHERE
    id = $1 AND
    product_type_id = (SELECT id FROM product_type WHERE identifier = 'Membership')

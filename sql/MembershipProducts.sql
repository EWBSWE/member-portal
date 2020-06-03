SELECT *
FROM product
WHERE product_type_id = (SELECT id FROM product_type WHERE identifier = 'Membership')

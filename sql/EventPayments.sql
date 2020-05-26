SELECT
    event_payment.payment_id,
    name,
    email,
    amount,
    message,
    array_agg(payment_product.product_id) AS addons
FROM event_payment
JOIN payment ON event_payment.payment_id = payment.id
JOIN member ON payment.member_id = member.id
JOIN payment_product ON payment.id = payment_product.payment_id
GROUP BY
    event_payment.payment_id,
    name,
    email,
    amount,
    message

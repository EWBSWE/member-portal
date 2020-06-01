UPDATE event_product
SET capacity = (capacity - 1)
WHERE
    event_id = $1 AND
    id IN ($2:csv) AND
    capacity > 0
;

INSERT INTO event_participant (event_id, email, name, comment)
VALUES ($1, $3, $4, $5)

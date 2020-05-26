INSERT INTO event_subscriber (event_id, email)
VALUES ($1, $2)
RETURNING *

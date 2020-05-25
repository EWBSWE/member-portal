UPDATE event
SET
    name = $2,
    description = $3,
    identifier = $4,
    active = $5,
    due_date = $6,
    notification_open = $7
WHERE id = $1
RETURNING *

INSERT INTO event (name, description, identifier, active, due_date, notification_open, email_template_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *

INSERT INTO email_template (sender, subject, body)
VALUES ($1, $2, $3)
RETURNING *

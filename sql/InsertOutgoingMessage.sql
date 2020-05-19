INSERT INTO outgoing_message (recipient, sender, subject, body)
VALUES ($1, $2, $3, $4)
RETURNING id

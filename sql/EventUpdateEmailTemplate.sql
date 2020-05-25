UPDATE email_template
SET
    subject = $2,
    body = $3
WHERE id = $1

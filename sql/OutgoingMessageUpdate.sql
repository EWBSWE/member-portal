UPDATE outgoing_message
SET failed_attempts = $2
WHERE id = $1

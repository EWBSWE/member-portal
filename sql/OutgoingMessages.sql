SELECT *
FROM outgoing_message
WHERE NOW() > send_at
ORDER BY priority DESC
LIMIT $1

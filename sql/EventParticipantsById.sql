SELECT event_id, member_id, name, email
FROM event_participant
JOIN member ON member.id = member_id
WHERE event_id = $1

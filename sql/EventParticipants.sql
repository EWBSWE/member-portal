SELECT event_id, member_id, name, email
FROM event_participant
JOIN member ON member_id = member.id

SELECT chapter.id, name, member_type, member_type_id
FROM chapter
JOIN member_type ON chapter.member_type_id = member_type.id
ORDER BY name ASC

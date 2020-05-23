SELECT *
FROM event
WHERE
    active AND
    identifier = $1

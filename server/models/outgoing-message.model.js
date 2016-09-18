'use strict';

var db = require('../db').db;

function create(attributes) {
    return db.one(`
        INSERT INTO outgoing_message (recipient, sender, subject, body)
        VALUES ($[recipient], $[sender], $[subject], $[body])
        RETURNING id
    `, attributes);
}

function fetch(n) {
    return db.any(`
        SELECT id, recipient, sender, subject, body, failed_attempts
        FROM outgoing_message
        WHERE NOW() > send_at
        ORDER BY priority DESC
        LIMIT $1
    `, n);
}

function remove(id) {
    console.log('removing', id);
    return db.none(`
        DELETE FROM outgoing_message
        WHERE id = $1
    `, id);
}

function fail(id) {
    return db.one(`
        UPDATE outgoing_message
        SET failed_attempts = failed_attempts + 1
        WHERE id = $1
    `, id);
}

module.exports = {
    create: create,
    fetch: fetch,
    remove: remove,
    fail: fail
};

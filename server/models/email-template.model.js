'use strict';

var db = require('../db').db;

function create(attributes) {
    return db.one(`
        INSERT INTO email_template (
            sender,
            subject,
            body
        ) VALUES (
            $[sender],
            $[subject],
            $[body]
        ) RETURNING id
    `, attributes);
}

module.exports = {
    create: create,
};

'use strict';

var db = require('../db').db;

function create(attributes) {
    return txCreate(attributes, db);
}

function txCreate(attributes, transaction) {
    return transaction.one(`
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
    txCreate: txCreate,
};

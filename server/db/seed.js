'use strict';

let db = require('../db').db;

let Member = require('../models/member.model');

function deleteMembers(transaction) {
    return transaction.any(`DELETE FROM member`);
}

function deleteErrors(transaction) {
    return transaction.any(`DELETE FROM ewb_error`);
}

function insertAuthenticatableMembers(transaction) {
    return Member.txCreateAuthenticatable('admin@admin.se', 'Test1234', 'admin', transaction);
}

function empty() {
    return db.tx(t => {
        let queries = [
            deleteMembers(t),
            deleteErrors(t),
        ];

        return t.batch(queries);
    });
}

function populate() {
    return db.tx(t => {
        let queries = [
            insertAuthenticatableMembers(t),
        ];

        return t.batch(queries);
    });
}


module.exports = {
    empty: empty,
    populate: populate
}

/**
 * Member type model
 *
 * @namespace model.MemberType
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

function index() {
    return db.any(`
        SELECT id, member_type
        FROM member_type
    `);
}

function find(memberType) {
    return db.oneOrNone(`
        SELECT id, member_type
        FROM member_type
        WHERE member_type = $1
    `, memberType);
}

module.exports = {
    index: index,
    find: find,
};

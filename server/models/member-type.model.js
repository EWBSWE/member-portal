/**
 * Member type model
 *
 * @namespace model.MemberType
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

/**
 * Find all member types
 *
 * @namespace model.MemberType
 * @memberOf model
 * @returns {Promise<Array|Error>} Resolves to an array of member types
 */
function index() {
    return db.any(`
        SELECT id, member_type
        FROM member_type
    `);
}

/**
 * Find single member type
 *
 * @namespace model.MemberType
 * @memberOf model
 * @param {String} memberType - String representation of a member type
 * @returns {Promise<Object|Error>} Resolves to a member type
 */
function find(memberType) {
    return db.oneOrNone(`
        SELECT id, member_type
        FROM member_type
        WHERE member_type = $1
    `, memberType);
}

/**
 * Create a member type
 *
 * @namespace model.MemberType
 * @memberOf model
 * @param {String} memberType - String representation of a member type
 * @returns {Promise<Object|Error>} Resolves to a member type
 */
function create(memberType) {
    return db.one(`
        INSERT INTO member_type (member_type)
        VALUES ($1)
        RETURNING id
    `, memberType);
}

module.exports = {
    index: index,
    find: find,
    create: create,
};

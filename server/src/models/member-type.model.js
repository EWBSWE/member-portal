/**
 * Member type model
 *
 * @namespace model.MemberType
 * @memberOf model
 */

"use strict";

var db = require("../db").db;

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
  return db.oneOrNone(
    `
        SELECT id, member_type
        FROM member_type
        WHERE member_type = $1
    `,
    memberType
  );
}

module.exports = {
  index: index,
  find: find,
};

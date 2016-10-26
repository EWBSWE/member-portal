/**
 * Payment model
 *
 * @namespace model.Payment
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

/**
 * Fetch all payments
 *
 * @memberOf model.Payment
 * @returns {Promise<Array|Error>} Resolves to an array of payments
 */
function index() {
    return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        ORDER BY id
    `);
}

/**
 * Fetch a payment
 *
 * @memberOf model.Payment
 * @param {Number} id - Payment id
 * @returns {Promise<Object|Error>} Resolves to a payment
 */
function get(id) {
    return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        WHERE id = $1
    `, id);
}

/**
 * Fetch all payments by member
 *
 * @memberOf model.Payment
 * @param {Number} memberId - Member id
 * @returns {Promise<Array|Error>} Resolves to an array of payments
 */
function find(memberId) {
    return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        WHERE member_id = $1
    `, memberId);
}

module.exports = {
    index: index,
    get: get,
    find: find,
}

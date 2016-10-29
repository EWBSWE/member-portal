/**
 * Payment model
 *
 * @namespace model.Payment
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

var postgresHelper = require('../helpers/postgres.helper');

const COLUMN_MAP = {
    amount: 'amount',
    memberId: 'member_id',
    currencyCode: 'currency_code',
    createdAt: 'created_at',
};

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
        ORDER BY created_at DESC
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
 * Create payments
 *
 * @memberOf model.Payment
 * @param {Object|Array} data - Either an object or an array of objects
 * containing payment attributes>
 * @returns {Promise<Object|Array|Error>} Resolves to either to an object or
 * array of objects.
 */
function create(data) {
    let _create = (payment, transaction) => {
        let {columns, wrapped} = postgresHelper.mapDataForInsert(COLUMN_MAP, payment);

        let sql = `
            INSERT INTO payment (${columns})
            VALUES (${wrapped})
            RETURNING id
        `;

        return transaction.one(sql, payment);
    };

    if (Array.isArray(data)) {
        return db.tx(transaction => {
            let queries = data.map(payment => {
                return _create(payment, transaction);
            });

            return transaction.batch(queries);
        });
    } else {
        return _create(payment, db);
    }
}

/**
 * Find all payments by specifying attributes
 *
 * @memberOf model.Payment
 * @param {Object} data - Object containing attributes to query against.
 * @returns {Promise<Array|Error>} Resolves to an array of objects.
 */
function findBy(data) {
    let wheres = postgresHelper.where(COLUMN_MAP, data);

    return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        WHERE ${wheres.clause}
    `, wheres.data);
}

module.exports = {
    index: index,
    get: get,
    findBy: findBy,
    create: create,
};

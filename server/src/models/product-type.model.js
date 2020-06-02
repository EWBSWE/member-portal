/**
 * Product type model
 *
 * @namespace model.ProductType
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

/**
 * Returns a product type
 *
 * @memberOf model.ProductType
 * @param {string} - identifier Some identifier
 * @return {Promise<object, Error>} - Resolves to a product type
 */
function find(identifier) {
    return db.oneOrNone(`
        SELECT id, identifier
        FROM product_type
        WHERE identifier = $1
    `, identifier);
}

/**
 * Create a product type
 *
 * @memberOf model.ProductType
 * @param {string} identifier - The product type identifier
 * @returns {Promise<object, Error>} - Resolves to a product type
 */
function create(identifier) {
    return db.one(`
        INSERT INTO product_type (identifier)
        VALUES ($1)
        RETURNING id
    `, identifier);
}

module.exports = {
    find: find,
    create: create,
    MEMBERSHIP: 'Membership',
    EVENT: 'Event',
};

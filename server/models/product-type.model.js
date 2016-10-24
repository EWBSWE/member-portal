/**
 * Product type model
 *
 * @namespace ProductType
 * @memberOf Models
 */

'use strict';

var db = require('../db').db;

/**
 * Returns a Product Type given an identifier, like Membership or Event.
 *
 * @param {string} identifier Some identifier
 * @return {Promise} Either a product type, or nothing
 */
function find(identifier) {
    return db.oneOrNone(`
        SELECT id, identifier
        FROM product_type
        WHERE identifier = $1
    `, identifier);
}

module.exports = {
    find: find,
    MEMBERSHIP: 'Membership',
    EVENT: 'Event',
};

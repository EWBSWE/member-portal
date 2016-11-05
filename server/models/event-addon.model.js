/**
 * Event addon model
 *
 * @namespace model.EventAddon
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

let Product = require('./product.model');
let ProductType = require('./product-type.model');

let postgresHelper = require('../helpers/postgres.helper');

const COLUMN_MAP = {
    eventId: 'event_id',
    capacity: 'capacity',
    productId: 'product_id',
};

/**
 * Create event addon
 *
 * @memberOf model
 * @param {Object} data - Object of event addon attributes
 * @returns {Promise} Resolves to an event addon
 */
function create(data) {
    return ProductType.find(ProductType.EVENT).then(pt => {
        data.productTypeId = pt.id;

        return Product.create(data);
    }).then(p => {
        data.productId = p.id;

        let {columns, wrapped} = postgresHelper.insert(COLUMN_MAP, data);

        return db.one(`
            INSERT INTO event_addon (${columns})
            VALUES (${wrapped})
            RETURNING id, capacity
        `, data);
    });
}

module.exports = {
    create: create,
};

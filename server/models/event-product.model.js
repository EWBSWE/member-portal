/**
 * Event product model
 *
 * @namespace model.EventProduct
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
 * Create event product
 *
 * @memberOf model.EventProduct
 * @param {Object} data - Object of event product attributes
 * @returns {Promise<Object|Error>} Resolves to an event product
 */
function create(data) {
    return ProductType.find(ProductType.EVENT).then(pt => {
        data.productTypeId = pt.id;

        return Product.create(data);
    }).then(p => {
        data.productId = p.id;

        let {columns, wrapped} = postgresHelper.insert(COLUMN_MAP, data);

        return db.one(`
            INSERT INTO event_product (${columns})
            VALUES (${wrapped})
            RETURNING id, capacity
        `, data);
    });
}

/**
 * Delete event product
 *
 * @memberOf model.EventProduct
 * @param {Number} id - Event product id
 * @returns {Promise<Null|Error>} Resolves to null
 */
function destroy(id) {
    return db.any(`
        DELETE FROM event_product
        WHERE id = $1
    `, id);
}

/**
 * Update event product
 *
 * @memberOf model.EventProduct
 * @param {Number} id - Event product id
 * @param {Object} data - Event product data
 * @returns {Promise<Null|Error>} Resolves to null
 */
function update(id, data) {
    return db.one(`SELECT product_id, capacity FROM event_product WHERE id = $1`, id).then(addon => {
        return Product.update(addon.product_id, data);
    }).then(() => {
        return db.none(`UPDATE event_product SET capacity = $1 WHERE id = $2`, [data.capacity, id]);
    });
}

module.exports = {
    create: create,
    destroy: destroy,
    update: update,
};

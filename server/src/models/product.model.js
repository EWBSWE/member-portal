/**
 * Product model
 *
 * @namespace model.Product
 * @memberOf model
 */

'use strict';

var db = require('../db').db;
var postgresHelper = require('../helpers/postgres.helper');

const COLUMN_MAP = {
    name: 'name',
    price: 'price',
    description: 'description',
    attribute: 'attribute',
    productTypeId: 'product_type_id',
    currencyCode: 'currency_code',
};

/**
 * Return product
 *
 * @memberOf model.Product
 * @param {number} id - Product id
 * @returns {Promise<Object|Error>} - Resolves to a product
 */
function get(id) {
    return db.oneOrNone(`
        SELECT
            id,
            name,
            price,
            description,
            attribute,
            product_type_id,
            currency_code
        FROM product
        WHERE id = $1
    `, id).then(p => {
        if (p) {
            p.id = +p.id;
            p.price = +p.price;
            p.product_type_id = +p.product_type_id;
        }

        return Promise.resolve(p);
    });
}

/**
 * Create product or products depending on input. If data is an object assume
 * we create a single product otherwise we create an array of products.
 *
 * @memberOf model.Product
 * @param {Object|Array} data - Product data
 * @returns {Promise<Object|Array|Error>} - Resolves to a single product or an
 * array of products
 */
function create(data) {
    let _create = (product, transaction) => {
        let {columns, wrapped} = postgresHelper.mapDataForInsert(COLUMN_MAP, product);

        if (columns === null || wrapped === null) {
            return null;
        }

        let sql = `
            INSERT INTO product (${columns})
            VALUES (${wrapped})
            RETURNING *
        `;

        return transaction.one(sql, product);
    };

    // If data is an array, assume we want to create multiple products.
    // Otherwise we try to create a single product.
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return Promise.reject('Missing attributes');
        }

        return db.tx(transaction => {
            let queries = data.map(product => {
                return _create(product, transaction);
            });

            if (queries.includes(null)) {
                return Promise.reject(new Error('Some products could not be mapped'));
            }

            return transaction.batch(queries);
        }).then(products => {
            products.forEach(p => {
                p.id = +p.id;
                p.price = +p.price;
                p.product_type_id = +p.product_type_id;
            });

            return Promise.resolve(products);
        });
    } else {
        if (!data.name || !data.price || !data.productTypeId) {
            return Promise.reject('Missing attributes');
        }

        return _create(data, db).then(p => {
            p.id = +p.id;
            p.price = +p.price;
            p.product_type_id = +p.product_type_id;

            return Promise.resolve(p);
        });
    }
}

function findByProductTypeId(id) {
    return db.any(`
        SELECT
            id,
            name,
            price,
            description,
            attribute,
            product_type_id,
            currency_code
        FROM product
        WHERE product_type_id = $1
    `, id).then(p => {
        if (p) {
            p.id = +p.id;
            p.price = +p.price;
            p.product_type_id = +p.product_type_id;
        }

        return Promise.resolve(p);
    });
}

function update(id, data) {
    let mapped = postgresHelper.update(COLUMN_MAP, data);
    if (mapped === null) {
        return Promise.reject('Product: No attributes to update');
    }

    return db.one(`
        UPDATE product
        SET ${mapped}
        WHERE id = $[id]
        RETURNING *
    `, Object.assign(data, { id }));
}

module.exports = {
    get: get,
    create: create,
    findByProductTypeId: findByProductTypeId,
    update: update,
};

'use strict';

var db = require('../db').db;

function index() {
    return db.any(`
        SELECT
            id,
            name,
            price,
            description,
            product_type_id,
            currency_code,
            created_at,
            updated_at
        FROM product
        ORDER BY id
    `);
}

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
    `, id);
}

function createProductType(identifier) {
    return db.one(`
        INSERT INTO product_type (identifier)
        VALUES ($1)
        RETURNING id
    `, identifier);
}

// TODO why does function create many ????
// ???????????????
function create(attributes) {
    if (!Array.isArray(attributes)) {
        attributes = [attributes];
    }

    return db.tx(transaction => {
        let queries = attributes.map(data => {
            if (!data.attribute) {
                data.attribute = {};
            }

            // TODO why not take an productType id instead of the identifier???
            return transaction.one(`
                INSERT INTO product (
                    product_type_id, name, price, description, attribute
                ) VALUES (
                    (
                    SELECT id
                    FROM product_type
                    WHERE identifier LIKE $[productType]
                    ), $[name], $[price], $[description], $[attribute]
                )
                RETURNING *
            `, data);
        });

        return transaction.batch(queries);
    });
}

function findByProductType(productType) {
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
        WHERE product_type_id = (SELECT id FROM product_type WHERE identifier = $1)
    `, productType);
}

module.exports = {
    index: index,
    get: get,
    createProductType: createProductType,
    create: create,
    findByProductType: findByProductType,
};

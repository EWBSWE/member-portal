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

function create(attributes) {
    if (!Array.isArray(attributes)) {
        attributes = [attributes];
    }

    return db.tx(transaction => {
        let queries = attributes.map(data => {
            data.attribute = {};

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

module.exports = {
    index: index,
    get: get,
    createProductType: createProductType,
    create: create,
};

//var mongoose = require('mongoose');
//var Schema = mongoose.Schema;

//var ProductType = require('./product-type.model');

//var ProductSchema = new Schema({
    //name: { type: String, required: true },
    //price: { type: Number, min: 0, required: true },
    //description: { type: String },
    //type: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductType', required: true },
    //typeAttributes: { type: mongoose.Schema.Types.Mixed },
    //currency: { type: String, required: true, default: 'SEK' },
    //createdAt: { type: Date, required: true, default: Date.now },
//});

//module.exports = mongoose.model('Product', ProductSchema);

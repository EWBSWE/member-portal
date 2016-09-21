'use strict';

var db = require('../db').db;

function index() {
    return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        ORDER BY id
    `);
}

function get(id) {
    return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        WHERE id = $1
    `, id);
}

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

//var mongoose = require('mongoose');
//var Schema = mongoose.Schema;

//var Buyer = require('./buyer.model');
//var Product = require('./product.model');

//var PaymentSchema = new Schema({
    //buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
    //products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    //amount: { type: Number, required: true },
    //currency: { type: String, required: true, default: 'SEK' },
    //createdAt: { type: Date, required: true, default: Date.now },
//});

//PaymentSchema.index({ buyer: 1 });

//module.exports = mongoose.model('Payment', PaymentSchema);

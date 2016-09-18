'use strict';

var db = require('../db').db;

function index() {
    return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM index
        ORDER BY id
    `);
}

module.exports = {
    index: index,
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

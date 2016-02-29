'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentSchema = new Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'SEK' },
    createdAt: { type: Date, required: true, default: Date.now },
});

PaymentSchema.index({ payer: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);

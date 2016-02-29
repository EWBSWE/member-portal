'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductType', required: true },
    typeAttributes: { type: mongoose.Schema.Types.Mixed },
    currency: { type: String, required: true, default: 'SEK' },
    createdAt: { type: Date, required: true, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema);

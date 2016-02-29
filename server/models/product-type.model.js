'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductTypeSchema = new Schema({
    identifier: { type: String, unique: true, required: true },
});

module.exports = mongoose.model('ProductType', ProductTypeSchema);

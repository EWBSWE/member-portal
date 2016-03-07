'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OptionSchema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    description: { type: String },
});

module.exports = mongoose.model('Option', OptionSchema);

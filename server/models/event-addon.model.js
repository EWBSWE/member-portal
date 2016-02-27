'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventAddonSchema = new Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true }, 
    price: { type: Number, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
});

module.exports = mongoose.model('EventAddon', EventAddonSchema);

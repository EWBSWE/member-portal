'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');


// TODO add missing attributes

var EventSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true }, 
    price: { type: Number, required: true },
    active: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, required: true, default: Date.now },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventParticipant' }],
});

module.exports = mongoose.model('Event', EventSchema);

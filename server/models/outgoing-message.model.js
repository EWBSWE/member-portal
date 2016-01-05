'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var OutgoingMessageSchema = new Schema({
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    sendAt: { type: Date, default: Date.now },
    priority: { type: Number, default: 0 },
    failedAttempts: { type: Number, default: 0 },
});

module.exports = mongoose.model('OutgoingMessage', OutgoingMessageSchema);

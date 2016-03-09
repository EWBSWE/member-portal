'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var EventAddon = require('./event-addon.model');
var EventParticipant = require('./event-participant.model');
var Payment = require('./payment.model');

var EventSchema = new Schema({
    name: { type: String, required: true, trim: true },
    identifier: { type: String, lowercase: true, unique: true },
    description: { type: String, required: true }, 
    active: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, required: true, default: Date.now },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventParticipant' }],
    dueDate: { type: Date, required: true },
    contact: { type: String, required: true },
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventAddon' }],
    confirmationEmail: {
        subject: { type: String, required: true },
        body: { type: String, required: true },
    },
    notificationOpen: { type: Boolean, required: true, default: true },
    subscribers: [{ type: String, trim: true, lowercase: true }],
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
});

EventSchema.index({ identifier: 1 });

module.exports = mongoose.model('Event', EventSchema);

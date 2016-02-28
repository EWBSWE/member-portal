'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventParticipantSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    eventVariants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventVariant' }],
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
});

module.exports = mongoose.model('EventParticipant', EventParticipantSchema);

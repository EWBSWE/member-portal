'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentSchema = new Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    eventParticipant: { type: mongoose.Schema.Types.ObjectId, ref: 'EventParticipant' },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'SEK' },
    createdAt: { type: Date, required: true, default: Date.now },
});

PaymentSchema.pre('save', function(next) {
    if (!this.member && !this.eventParticipant) {
        console.log('Need to have either member or eventParticipant');
        next(new Error('Missing member or eventParticipant'));
    } else {
        next();
    }
});

PaymentSchema.index({member: 1});

module.exports = mongoose.model('Payment', PaymentSchema);

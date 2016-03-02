'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Member = require('./member.model');

var EventParticipantSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
});

EventParticipantSchema.pre('save', function(next) {
    if (this.isNew) {
        Member.findOne({ email: this.email }, function(err, maybeMember) {
            if (err) {
                // What do, hm?
            }

            if (maybeMember) {
                this.member = maybeMember._id;
            }

            next();
        }.bind(this));
    } else {
        next();
    }
});

module.exports = mongoose.model('EventParticipant', EventParticipantSchema);

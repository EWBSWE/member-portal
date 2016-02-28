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
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
});

module.exports = mongoose.model('EventParticipant', EventParticipantSchema);

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var EventParticipantSchema = new Schema({
    email: { 
        type: String, 
        required: true, 
        trim: true, 
        unique: true, 
        lowercase: true,
    },
});

module.exports = mongoose.model('EventParticipant', EventParticipantSchema);

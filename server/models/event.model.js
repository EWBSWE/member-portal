'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');


// TODO add missing attributes

var EventSchema = new Schema({
    name: { type: String, required: true, trim: true },
    identifier: { type: String, lowercase: true, unique: true },
    description: { type: String, required: true }, 
    price: { type: Number, required: true },
    active: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, required: true, default: Date.now },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventParticipant' }],
});

// Generate an identifier based on the name of the event. Will collide with
// other events in the future since it is rather basic at the moment.
EventSchema.pre('save', function(next) {
    this.identifier = this.name.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9\-]/g, '');

    next();
});

EventSchema.index({ identifier: 1 });

module.exports = mongoose.model('Event', EventSchema);

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// References to the possible type a payer can be.
var types = [ 
    'Member', 
    'EventParticipant',
];

var BuyerSchema = new Schema({
    type: { type: String, enum: types, required: true },
    document: { type: mongoose.Schema.Types.ObjectId, required: true },
});

module.exports = mongoose.model('Buyer', BuyerSchema);

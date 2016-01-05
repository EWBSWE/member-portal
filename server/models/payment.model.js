'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PaymentSchema = new Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'SEK' },
  createdAt: { type: Date, required: true, default: Date.now },
});

PaymentSchema.index({member: 1});

module.exports = mongoose.model('Payment', PaymentSchema);

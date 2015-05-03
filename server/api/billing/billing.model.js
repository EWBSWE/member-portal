'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BillingSchema = new Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  amount: {type: Number, required: true},
  currency: {type: String, required: true, default: 'SEK'},
  status: {type: String, required: true},
  paidAt: {type: Date},
  billingType: {type: String, required: true},
  invoiceNumber: {type: Number, required: true}
});

module.exports = mongoose.model('Billing', BillingSchema);

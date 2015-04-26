'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BillingSchema = new Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  amount: {type: Number},
  currency: {type: String},
  status: {type: String},
  paidAt: {type: Date},
  billingType: {type: String},
  invoiceNumber: {type: Number}
});

module.exports = mongoose.model('Billing', BillingSchema);

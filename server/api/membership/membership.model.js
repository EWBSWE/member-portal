'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MembershipSchema = new Schema({
  email: String,
  isStudent: Boolean,
  subscriptionLength: Number
});

module.exports = mongoose.model('Membership', MembershipSchema);

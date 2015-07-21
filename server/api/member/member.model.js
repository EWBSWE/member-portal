'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var MemberSchema = new Schema({
  email: {
    type: String, 
    lowercase: true, 
    unique: true, 
    required: true 
  },
  student: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, default: moment() },
  expirationDate: { type: Date, default: moment().add(1, 'year') },
});

MemberSchema
  .path('email')
  .validate(function(email) {
    return email.length;
  }, 'Email cannot be blank');


module.exports = mongoose.model('Member', MemberSchema);

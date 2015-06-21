'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MemberSchema = new Schema({
  email: {
    type: String, 
    lowercase: true, 
    index: { unique: true }, 
    required: true 
  },
  student: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, default: new Date() }
});

MemberSchema
  .path('email')
  .validate(function(email) {
    return email.length;
  }, 'Email cannot be blank');


module.exports = mongoose.model('Member', MemberSchema);

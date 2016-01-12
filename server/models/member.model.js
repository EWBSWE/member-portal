'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var genders = [ 'female', 'male', 'other' ];
var types = [ 'student', 'working', 'senior' ];

var MemberSchema = new Schema({
  name: { type: String, trim: true, required: true },
  location: { type: String, trim: true },
  education: { type: String, trim: true },
  profession: { type: String, trim: true },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: true,
    trim: true,
  },
  type: { type: String, enum: types },
  gender: { type: String, enum: genders },
  yearOfBirth: { type: Number, min: 0 },
  createdAt: { type: Date, default: Date.now },
  expirationDate: { type: Date, required: true, default: function () { return moment().add(1, 'year') } },
});

MemberSchema
  .path('email')
  .validate(function(email) {
    return email.length;
  }, 'Email cannot be blank');

MemberSchema.index({expirationDate: 1});
MemberSchema.index({email: 1});

module.exports = mongoose.model('Member', MemberSchema);

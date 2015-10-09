'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ewbError = new Schema({
  message: { type: String, required: true },
  origin: { type: String, required: true },
  params: { type: Object, required: true, default: {} },
  createdAt: { type: Date, required: true, default: new Date() },
});

module.exports = mongoose.model('ewbError', ewbError);

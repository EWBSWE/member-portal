'use strict';

var fs = require('fs');
var path = require('path');
var devSettings = require(path.join(__dirname, 'development.local.js'));

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/ewbmember-dev'
  },

  seedDB: true,

  developerMail: devSettings.mail,

};

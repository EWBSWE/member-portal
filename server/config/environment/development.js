'use strict';

var fs = require('fs');
var path = require('path');
var devSettings = require(path.join(__dirname, 'development.local.js'));

module.exports = {
  seedDB: true,
  developerMail: devSettings.mail,
};

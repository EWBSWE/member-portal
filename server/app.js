'use strict';

const path = require('path');
const dotenv = require('dotenv')
      .config({ path: path.resolve(__dirname, '.env') });

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('NODE_ENV:', process.env.NODE_ENV);

var express = require('express');
var environment = require('./config/environment');

process.env.DEV_MAIL = process.env.DEV_MAIL || environment.developerMail;

// Setup server
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(environment.port, environment.ip, function () {
  console.log('Express server listening on %d, in %s mode', environment.port, app.get('env'));
});

// Expose app
exports = module.exports = app;

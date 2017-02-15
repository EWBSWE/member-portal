'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var Member = require('../models/member.model');

// Passport Configuration
require('./local/passport').setup(Member, config);

var router = express.Router();

router.use('/local', require('./local'));

module.exports = router;

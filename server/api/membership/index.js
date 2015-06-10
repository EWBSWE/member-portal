'use strict';

var express = require('express');
var controller = require('./membership.controller');

var router = express.Router();

router.post('/', controller.create);

module.exports = router;

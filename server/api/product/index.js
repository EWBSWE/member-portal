'use strict';

var express = require('express');
var controller = require('./product.controller');

var router = express.Router();

router.get('/membership', controller.membership);
router.get('/event', controller.ewbEvent);

module.exports = router;

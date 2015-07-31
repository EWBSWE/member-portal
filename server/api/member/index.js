'use strict';

var express = require('express');
var controller = require('./member.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.delete('/:id', controller.destroy);

router.post('/bulk', controller.bulkAdd);
router.get('/:id/payments', controller.getPayments);

module.exports = router;

'use strict';

var express = require('express');
var controller = require('./member.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.get);
//router.get('/count', auth.isAuthenticated(), controller.getCount);
//router.get('/count/students/:student', auth.isAuthenticated(), controller.getCountByStudent);
router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

//router.post('/bulk', auth.isAuthenticated(), controller.bulkAdd);
//router.get('/:id/payments', auth.isAuthenticated(), controller.getPayments);

module.exports = router;

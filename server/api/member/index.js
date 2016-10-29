'use strict';

var express = require('express');
var controller = require('./member.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/:id/payments', auth.isAuthenticated(), controller.getPayments);

router.post('/', auth.isAuthenticated(), controller.create);
router.post('/bulk', auth.isAuthenticated(), controller.bulkCreate);

router.post('/reset-password', controller.resetPassword);
router.post('/reset-password-token', controller.resetPasswordWithToken);

router.put('/:id', auth.isAuthenticated(), controller.update);

router.delete('/:id', auth.isAuthenticated(), controller.destroy);


module.exports = router;

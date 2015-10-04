'use strict';

var express = require('express');
var controller = require('./payment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.hasRole('admin'), controller.show);

router.get('/user/:user', auth.hasRole('admin'), controller.getUsersPayments);
router.get('/my', auth.isAuthenticated(), controller.getMyPayments);

router.get('/:id/user/:user', auth.hasRole('admin'), controller.getUsersPayment);
router.get('/:id', auth.isAuthenticated(), controller.getMyPayment);

router.post('/user/:user', auth.hasRole('admin'), controller.createUsersPayment);
router.post('/', auth.isAuthenticated(), controller.createMyPayment);

router.post('/confirm', controller.confirmPayment);
router.get('/stripe-checkout', controller.stripeCheckoutKey);

router.put('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;

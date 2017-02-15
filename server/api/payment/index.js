'use strict';

var express = require('express');
var controller = require('./payment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/stripe-checkout', controller.stripeCheckoutKey);
router.get('/report', auth.isAuthenticated(), controller.generateReport);
router.get('/:id(\\d+)', auth.isAuthenticated(), controller.get);

router.post('/confirm', controller.confirmMembershipPayment);
router.post('/confirm-event', controller.confirmEventPayment);

module.exports = router;

'use strict';

var express = require('express');
var controller = require('./payment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/confirm', controller.confirmMembershipPayment);
router.post('/confirm-event', controller.confirmEventPayment);
router.get('/stripe-checkout', controller.stripeCheckoutKey);

router.post('/generate-report', auth.isAuthenticated(), controller.generateReport);

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id(\\d+)', auth.isAuthenticated(), controller.get);

module.exports = router;

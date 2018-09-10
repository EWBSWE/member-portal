'use strict';

const express = require('express');
const controller = require('./member.controller');
const auth = require('../../auth/auth.service');
const RouteBuilder = require('../../RouteBuilder');

const router = express.Router();

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

router.post(
  '/membership',
  new RouteBuilder(controller.createMemberFromPurchase)
    .requiredParams([
      'productId',
      'stripeToken'
    ])
    .build()
);

module.exports = router;


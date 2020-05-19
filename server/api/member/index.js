'use strict';

const express = require('express');
const controller = require('./member.controller');
const controller2 = require('./MemberController');
const auth = require('../../auth/auth.service');
const RouteBuilder = require('../../RouteBuilder');

const router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);

router.get(
  '/chapters',
  new RouteBuilder(controller2.getChapters)
    .build()
);
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/:id/payments', auth.isAuthenticated(), controller.getPayments);

router.post('/', auth.isAuthenticated(), controller.create);

//router.post('/bulk', auth.isAuthenticated(), controller.bulkCreate);
router.post(
  '/bulk',
  auth.isAuthenticated(),
  new RouteBuilder(controller2.bulk)
    .requiredParams([
      'members'
    ])
    .build()
);

router.put(
    '/:id',
    auth.isAuthenticated(),
    new RouteBuilder(controller2.update)
        .build()
);
// router.put('/:id', auth.isAuthenticated(), controller.update);

router.delete('/:id', auth.isAuthenticated(), controller.destroy);

router.post(
  '/membership',
  new RouteBuilder(controller2.createMemberFromPurchase)
    .requiredParams([
      'productId',
      'stripeToken'
    ])
    .build()
);


module.exports = router;


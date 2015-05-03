'use strict';

var express = require('express');
var controller = require('./billing.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);

router.get('/user/:user', auth.hasRole('admin'), controller.getUsersBillings);
router.get('/my', auth.isAuthenticated(), controller.getMyBillings);

router.get('/:id/user/:user', auth.hasRole('admin'), controller.getUsersBilling);
router.get('/:id', auth.isAuthenticated(), controller.getMyBilling);

router.post('/user/:user', auth.hasRole('admin'), controller.createUsersBilling);
router.post('/', auth.isAuthenticated(), controller.createMyBilling);

router.put('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;

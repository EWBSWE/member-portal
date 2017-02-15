'use strict';

var express = require('express');
var eventController = require('./event.controller');
var addonController = require('./event-product.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/public', eventController.showPublic);

router.get('/', auth.isAuthenticated(), eventController.index);
router.get('/:id', auth.isAuthenticated(), eventController.show);
router.post('/', auth.isAuthenticated(), eventController.create);
router.put('/:id', auth.isAuthenticated(), eventController.update);
router.delete('/:id', auth.isAuthenticated(), eventController.destroy);

router.post('/:id/add-participant', auth.isAuthenticated(), eventController.addParticipant);

router.post('/:id/addon', auth.isAuthenticated(), addonController.create)
router.delete('/:id/addon/:addonId', auth.isAuthenticated(), addonController.destroy);
router.put('/:id/addon/:addonId', auth.isAuthenticated(), addonController.update);

module.exports = router;

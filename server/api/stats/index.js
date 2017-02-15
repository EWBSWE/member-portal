'use strict';

const express = require('express');
const controller = require('./stats.controller');
const auth = require('../../auth/auth.service');

const router = express.Router();

router.get('/members', auth.isAuthenticated(), controller.members);

module.exports = router;

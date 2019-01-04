'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = chai.assert;

global.assert = assert;

process.env.STRIPE_LIVE_KEY = 'stripe_live_key';
process.env.STRIPE_LIVE_CHECKOUT_KEY = 'stripe_live_checkout_key';
process.env.STRIPE_TEST_KEY = 'stripe_test_key';
process.env.STRIPE_TEST_CHECKOUT_KEY = 'stripe_test_checkout_key';

module.exports = {};

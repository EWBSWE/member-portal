"use strict";

require("source-map-support").install();
const chai = require("chai");
chai.use(require("chai-as-promised"));
const assert = chai.assert;

global.assert = assert;

process.env.NODE_ENV = "test";
process.env.DB_URI = "dummy";
process.env.STRIPE_KEY = "stripe_key";
process.env.STRIPE_CHECKOUT_KEY = "stripe_checkout_key";
process.env.STRIPE_LIVE_KEY = "stripe_live_key";
process.env.STRIPE_LIVE_CHECKOUT_KEY = "stripe_live_checkout_key";
process.env.STRIPE_TEST_KEY = "stripe_test_key";
process.env.STRIPE_TEST_CHECKOUT_KEY = "stripe_test_checkout_key";

module.exports = {};

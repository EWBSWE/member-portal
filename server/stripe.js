'use strict';

const STRIPE_LIVE_KEY = process.env.STRIPE_LIVE_KEY;
const STRIPE_TEST_KEY = process.env.STRIPE_TEST_KEY;

if (!STRIPE_LIVE_KEY) {
  throw new Error(`Env variable STRIPE_LIVE_KEY is missing.`);
}
if (!STRIPE_TEST_KEY) {
  throw new Error(`Env variable STRIPE_TEST_KEY is missing.`);
}

module.exports = process.env.NODE_ENV === 'production' ?
  require('stripe')(STRIPE_LIVE_KEY) :
  require('stripe')(STRIPE_TEST_KEY);

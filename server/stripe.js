'use strict';

const STRIPE_LIVE_KEY = process.env.STRIPE_LIVE_KEY;
const STRIPE_LIVE_CHECKOUT_KEY = process.env.STRIPE_LIVE_CHECKOUT_KEY;

const STRIPE_TEST_KEY = process.env.STRIPE_TEST_KEY;
const STRIPE_TEST_CHECKOUT_KEY = process.env.STRIPE_TEST_CHECKOUT_KEY;

if (!STRIPE_LIVE_KEY) {
  throw new Error(`Env variable STRIPE_LIVE_KEY is missing.`);
}
if (!STRIPE_LIVE_CHECKOUT_KEY) {
  throw new Error(`Env variable STRIPE_LIVE_CHECKOUT_KEY is missing.`);
}

if (!STRIPE_TEST_KEY) {
  throw new Error(`Env variable STRIPE_TEST_KEY is missing.`);
}
if (!STRIPE_TEST_CHECKOUT_KEY) {
  throw new Error(`Env variable STRIPE_TEST_CHECKOUT_KEY is missing.`);
}

const stripe = process.env.NODE_ENV === 'production' ?
  require('stripe')(STRIPE_LIVE_KEY) :
  require('stripe')(STRIPE_TEST_KEY);


function getCheckoutKey() {
  if (process.env.NODE_ENV === 'production') {
    return STRIPE_LIVE_CHECKOUT_KEY;
  }

  return STRIPE_TEST_CHECKOUT_KEY;
}

function processCharge(chargeAttributes, stripeToken, successCallback, errorCallback) {
    stripe.charges.create({
        currency: chargeAttributes.currency,
        amount: chargeAttributes.amount * 100,
        source: stripeToken.id,
        description: chargeAttributes.description,
    }, function(err, charge) {
        if (err === null) {
            successCallback(charge);
        } else {
            errorCallback(err);
        }
    });
};

async function processCharge2(stripeToken, currency, amount, description) {
  return new Promise((resolve, reject) => {
    stripe.charges.create({
      source: stripeToken.id,
      amount: amount * 100,
      currency,
      description
    }, function(err, charge) {
      if (err) {
	reject(err);
      } else {
	resolve(charge);
      }
    });
  });
}

module.exports = {
  getCheckoutKey,
  processCharge,
  processCharge2
};

"use strict";

const STRIPE_KEY = process.env.STRIPE_KEY;
const STRIPE_CHECKOUT_KEY = process.env.STRIPE_CHECKOUT_KEY;

if (!STRIPE_KEY) {
  throw new Error(`Env variable STRIPE_KEY is missing.`);
}
if (!STRIPE_CHECKOUT_KEY) {
  throw new Error(`Env variable STRIPE_CHECKOUT_KEY is missing.`);
}

const stripe = require("stripe")(STRIPE_KEY);

function getCheckoutKey() {
  return STRIPE_CHECKOUT_KEY;
}

async function processCharge2(stripeToken, currency, amount, description) {
  return new Promise((resolve, reject) => {
    stripe.charges.create(
      {
        source: stripeToken.id,
        amount: amount * 100,
        currency,
        description,
      },
      function (err, charge) {
        if (err) {
          reject(err);
        } else {
          resolve(charge);
        }
      }
    );
  });
}

module.exports = {
  getCheckoutKey,
  processCharge2,
};

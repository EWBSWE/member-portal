'use strict';

var _ = require('lodash');
var Membership = require('./membership.model');
var stripe = require('stripe')('sk_test_XYJalXkc7mCuSxM2O5QBILf3');

exports.create = function(req, res) {
  var stripeToken = req.body.stripeToken;
  var subscriptionLength = req.body.subscriptionLength;
  var isStudent = req.body.isStudent;

  // TODO refactor this into model or something, currently duplicated between frontend
  // and backend
  var amount = 0;
  if (isStudent && subscriptionLength === '1') {
      amount = 40;
  } else if (isStudent && subscriptionLength === '3') {
      amount = 100;
  } else if (subscriptionLength === '1') {
      amount = 90;
  } else if (subscriptionLength === '3') {
      amount = 250;
  }

  amount = amount * 100;
  console.log(amount, subscriptionLength, isStudent);

  var chargeSuccessful = false;
  var errorMessage = 'Vi misslyckades med att genomföra din betalning';

  // communicate with stripe
  stripe.charges.create({
    currency: "SEK",
    amount: amount,
    source: stripeToken.id,
    description: "membership test charge",
  }, function(err, charge) {
    if (err) {
      // TODO act on errors
      if (err.type === 'StripeCardError') {
        // Card was declined
      } else if (err.type === 'StripeInvalidError') {
        // Invalid parameters were supplied to Stripe's API
      } else if (err.type === 'StripeAPIError') {
        // An error occurred internally with Stripe's API
      } else if (err.type === 'StripeConnectioncError') {
        // Some kind of error occurred during the HTTPS communication
      } else if (err.type === 'StripeAuthenticationError') {
        // Probably used incorrect API key
      }
    } else {
      chargeSuccessful = true;
    }
  });

  if (chargeSuccessful) {
    Membership.create(req.body, function(err, membership) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(201).json(membership);
    });
  } else {
      return res.status(400).json({ message: errorMessage });
  }
};

function handleError(res, err) {
  return res.status(500).send(err);
}

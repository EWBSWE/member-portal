'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Member = require('./member.model');
var Payment = require('../payment/payment.model');
var stripe = require('stripe')('sk_test_XYJalXkc7mCuSxM2O5QBILf3');

exports.index = function(req, res) {
  Member.find(function(err, members) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(members);
  });
};

exports.show = function(req, res) {
  Member.findOne({ _id: req.params.id }, function(err, member) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(member);
  });
};

exports.getPayments = function(req, res) {
  Payment.find({ member: new mongoose.Types.ObjectId(req.params.id) }, function(err, payments) {
    if (err) {
      return handleError(res, err);
    } 
    return res.status(200).json(payments);
  });
};

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

  // Set Stripe lowest monetary value. 1 USD should be sent as 100 cents and so
  // forth.
  amount = amount * 100;

  var chargeSuccessful = false;
  var errorMessage = 'Vi misslyckades med att genomföra din betalning';

  // communicate with stripe
  stripe.charges.create({
    currency: "SEK",
    amount: amount,
    source: stripeToken.id,
    description: "Membership test charge", // todo this shows up in the stripe web interface
  }, function(err, charge) {
    if (err === null) {
      chargeSuccessful = true;
    } else {
      console.log('err', err);
      // TODO act on errors
      if (err.type === 'StripeCardError') {
        // Card was declined
      } else if (err.type === 'StripeInvalidError') {
        // Invalid parameters were supplied to Stripe's API
      } else if (err.type === 'StripeAPIError') {
        // An error occurred internally with Stripe's API
      } else if (err.type === 'StripeConnectionError') {
        // Some kind of error occurred during the HTTPS communication
      } else if (err.type === 'StripeAuthenticationError') {
        // Probably used incorrect API key
      }
    }

    if (chargeSuccessful) {
      var createPayment = function(member) {
        Payment.create({ member: member, amount: amount }, function(err, payment) {
          if (err) {
            return handleError(res, err);
          }
          console.log('payment', err, payment);
          return res.status(201).json(payment);
        });
      };

      Member.findOne({ email: req.body.email }, function(err, member) {
        if (err) {
          // TODO successful payment
          console.log(err);
        }
        if (!member) {
          Member.create({ email: req.body.email, student: isStudent }, function(err, member) {
            if (err) {
              // TODO successful payment
              console.log(err);
            }
            createPayment(member);
          });
        } else {
          createPayment(member);
        }
      });
    } else {
      return res.status(400).json({ message: errorMessage });
    }
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
};
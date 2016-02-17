'use strict';

var _ = require('lodash');

var stripe = require('stripe')('***REMOVED***');
if (process.env.NODE_ENV === 'production') {
  stripe = require('stripe')('sk_live_aRwKpgsqwq7rpsozBg43Clx5');
}

var moment = require('moment');

var Payment = require('../../models/payment.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var ewbError = require('../../models/ewb-error.model');
var ewbMail = require('../../components/ewb-mail');

var EventHelper = require('../event/event.helper');

// Get list of payments
exports.index = function(req, res) {
  Payment.find(function (err, payments) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(payments);
  });
};

exports.show = function(req, res) {
  Payment.findOne({ _id: req.params.id }, function(err, payment) {
    if (err) {
      return handleError(res, err);
    } else {
      return res.status(200).json(payment);
    }
  });
};

exports.confirmMembershipPayment = function(req, res) {
  var stripeToken = req.body.stripeToken;
  var subscriptionLength = req.body.subscriptionLength;
  var type = req.body.type.trim();

  // TODO refactor this into model or something, currently duplicated between frontend
  // and backend
  var amount = 0;
  if (type === 'student' && subscriptionLength === '1') {
      amount = 40;
  } else if (type === 'student' && subscriptionLength === '3') {
      amount = 100;
  } else if (subscriptionLength === '1') {
      amount = 90;
  } else if (subscriptionLength === '3') {
      amount = 250;
  }

  // Set Stripe lowest monetary value. 1 USD should be sent as 100 cents and so
  // forth.
  var stripeAmount = amount * 100;

  var chargeSuccessful = false;
  // TODO Translate
  var errorMessage = 'Vi misslyckades med att genomföra din betalning.';

  // Communicate with stripe
  stripe.charges.create({
    currency: "SEK",
    amount: stripeAmount,
    source: stripeToken.id,
    description: "Medlemsregistrering",
  }, function(err, charge) {
    if (err === null) {
      chargeSuccessful = true;
    } else {
      ewbError.create({ message: 'Membership Stripe', origin: __filename, params: err });
      if (err.type === 'StripeCardError') {
        // TODO Translate
        errorMessage = 'Ditt kort medges ej. Ingen betalning genomförd.';
      } else if (err.type === 'RateLimitError') {
        // Too many requests made to the API too quickly
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
            ewbError.create({ message: 'Successful charge create payment', origin: __filename, params: err });
            return handleError(res, err);
          }
          return res.status(201).json(payment);
        });
      };

      Member.findOne({ email: req.body.email.trim() }, function(err, member) {
        if (err) {
          ewbError.create({ message: 'Successful charge find member', origin: __filename, params: err });
          // TODO what do on successful payment?
          console.log(err);
        }

        var expirationDate = moment().add(1, 'year');
        if (subscriptionLength === '3') {
          expirationDate = moment().add(3, 'year');
        }

        var receiptMail = {};

        if (member) {
          member.name = req.body.name;
          member.location = req.body.location;
          member.profession = req.body.profession;
          member.education = req.body.education;
          member.type = type;
          member.gender = req.body.gender;
          member.yearOfBirth = req.body.yearOfBirth;

          if (subscriptionLength === '1') {
              member.expirationDate = moment(member.expirationDate).add(1, 'year');
          } else if (subscriptionLength === '3') {
              member.expirationDate = moment(member.expirationDate).add(3, 'years');
          }

          member.save(function() {
            createPayment(member);
          });

          // Send renewal mail if old member
          if (process.env.NODE_ENV === 'production') {
            receiptMail = {
              from: ewbMail.sender(),
              to: req.body.email,
              subject: ewbMail.getSubject('renewal'),
              text: ewbMail.getBody('renewal'),
            };
          } else {
            receiptMail = {
              from: ewbMail.sender(),
              to: process.env.DEV_MAIL,
              subject: ewbMail.getSubject('renewal'),
              text: ewbMail.getBody('renewal'),
            };
          }

          OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
            if (err) {
              ewbError.create({ message: 'Membership receipt renewal mail', origin: __filename, params: err });
            }
          });
        } else {
          Member.create({
            name: req.body.name,
            location: req.body.location,
            profession: req.body.profession,
            education: req.body.education,
            email: req.body.email,
            type: type,
            gender: req.body.gender,
            yearOfBirth: req.body.yearOfBirth,
            expirationDate: expirationDate,
          }, function(err, member) {
            if (err) {
              ewbError.create({ message: 'Successful charge create member', origin: __filename, params: err });
              // TODO successful payment but failed to add member
              // send mail to admins and customer?
              console.log(err);
            }
            createPayment(member);

            // Send welcome mail if new member
            if (process.env.NODE_ENV === 'production') {
              receiptMail = {
                from: ewbMail.sender(),
                to: req.body.email,
                subject: ewbMail.getSubject('new-member'),
                text: ewbMail.getBody('new-member'),
              };
            } else {
              receiptMail = {
                from: ewbMail.sender(),
                to: process.env.DEV_MAIL,
                subject: ewbMail.getSubject('new-member'),
                text: ewbMail.getBody('new-member'),
              };
            }

            OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
              if (err) {
                ewbError.create({ message: 'Membership receipt new member mail', origin: __filename, params: err });
              }
            });
          });
        }
      });
    } else {
      return res.status(400).json({ message: errorMessage });
    }
  });
};

exports.confirmEventPayment = function(req, res) {
    function step1(err, ewbEvent) {
        if (err) {
            handleError(res, err);
        }
        return processCharge({
            currency: 'SEK',
            amount: ewbEvent.price,
            description: ewbEvent.name,
        }, req.body.stripeToken, function(charge) {
            // Successful charge
            return step2(ewbEvent);
        }, function(stripeError) {
            // Failed charge
            var error = handleStripeError(stripeError);
            return res.status(400).json(error);
        });
    };

    function step2(ewbEvent) {
        return EventHelper.addParticipant(ewbEvent, req.body.email, step3);
    };

    function step3(err, result) {
        // Stripe payment successful at this stage
        if (err) {
            return handleError(res, err);
        }

        return res.status(200).json(result);
    };

    EventHelper.fetchEvent(req.body.identifier, step1);
};

exports.stripeCheckoutKey = function (req, res) {
  var key = '***REMOVED***';
  if (process.env.NODE_ENV === 'production') {
    key = 'pk_live_ATJZnfiF1iDDCQvNK6IgEFA2';
  }
  
  return res.status(200).json({ key: key });
};

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
            ewbError.create({ message: 'Stripe process charge', origin: __filename, params: err });
            errorCallback(err);
        }
    });
};

function handleStripeError(err) {
    // TODO translate
    var errorMessage = 'Vi misslyckades med att genomföra din betalning.';

    ewbError.create({ message: 'Stripe charge error', origin: __filename, params: err});

    if (err.type === 'StripeCardError') {
        // TODO Translate
        errorMessage = 'Ditt kort medges ej. Ingen betalning genomförd.';
    } else if (err.type === 'RateLimitError') {
        // Too many requests made to the API too quickly
    } else if (err.type === 'StripeInvalidError') {
        // Invalid parameters were supplied to Stripe's API
    } else if (err.type === 'StripeAPIError') {
        // An error occurred internally with Stripe's API
    } else if (err.type === 'StripeConnectionError') {
        // Some kind of error occurred during the HTTPS communication
    } else if (err.type === 'StripeAuthenticationError') {
        // Probably used incorrect API key
    }

    return { message: errorMessage };
};

function handleError(res, err) {
    return res.status(500).send(err);
};

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
var MemberHelper = require('../member/member.helper');

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

    var expirationDate = moment().add(1, 'year');
    if (subscriptionLength === '3') {
        expirationDate = moment().add(3, 'years');
    }

    // Only trimming the email attribute since we are doing a lookup on that
    // email. The other attributes will be handled when inserted into the
    // database
    var memberData = {
        email: req.body.email.trim(),
        name: req.body.name,
        location: req.body.location,
        profession: req.body.profession,
        education: req.body.education,
        type: type,
        gender: req.body.gender,
        yearOfBirth: req.body.yearOfBirth,
        expirationDate: expirationDate,
    };

    console.log('initial member data', memberData);

    function step1() {
        MemberHelper.fetchMember(memberData.email, function(err, maybeMember) {
            if (err) {
                return handleError(res, err);
            }
            if (maybeMember) {
                // Member exists, go to next step
                return step2(maybeMember);
            } else {
                // Member doesn't exist, we need to create the member before we
                // proceed
                MemberHelper.createMember(memberData, function(err, member) {
                    if (err) {
                        return handleError(res, err);
                    }

                    return step3(member);
                });
            }
        });
    };

    function step2(member) {
        if (moment(member.expirationDate) > moment()) {
            // Default to 1 day
            var daysDiff = moment(member.expirationDate).diff(moment(), 'days') || 1;
            memberData.expirationDate.add(daysDiff, 'days');
        }

        MemberHelper.updateMember(member, memberData, function(err, updatedMember) {
            if (err) {
                return handleError(res, err);
            }

            return step3(updatedMember);
        });
    };

    function step3(member) {
        // Add payment to member
        Payment.create({ member: member, amount: amount }, function(err, payment) {
          if (err) {
            return handleError(res, err);
          }

          return step4(member);
        });
    };

    function step4(member) {
        var receiptMail = {
            from: ewbMail.sender(),
            to: process.env.NODE_ENV === 'production' ? req.body.email : process.env.DEV_MAIL,
        };

        if (member.isNew) {
            receiptMail.subject = ewbMail.getSubject('new-member');
            receiptMail.text = ewbMail.getBody('new-member');
        } else {
            receiptMail.subject = ewbMail.getSubject('renewal');
            receiptMail.text = ewbMail.getBody('renewal');
        }

        OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
            if (err) {
                ewbError.create({ message: 'Membership receipt mail', origin: __filename, params: err });
            }
        });

        return res.status(201).json(member);
    };

    processCharge({
        currency: 'SEK',
        amount: amount,
        description: 'Medlemsregistrering',
    }, stripeToken, step1, function(err) {
        var error = handleStripeError(err);
        return res.status(400).json(error);
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

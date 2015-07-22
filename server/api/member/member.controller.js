'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Member = require('./member.model');
var Payment = require('../payment/payment.model');
var stripe = require('stripe')('sk_test_XYJalXkc7mCuSxM2O5QBILf3');
var moment = require('moment');

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

exports.create = function(req, res) {
  Member.findOne({ email: req.body.email }, function(err, member) {
    if (err) {
      return handleError(res, err);
    }

    if (member) {
      return res.status(400).json({ message: 'Member exists' });
    } else {
      Member.create({
        name: req.body.name,
        location: req.body.location,
        telephone: req.body.telephone,
        profession: req.body.profession,
        email: req.body.email,
        student: req.body.student,
        expirationDate: req.body.expirationDate,
      }, function(err, member) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(201).json(member);
      });
    }
  });
};

exports.destroy = function(req, res) {
  Member.findById(req.params.id, function(err, member) {
    if (err) {
      return handleError(res, err);
    }
    if (!member) {
      return res.sendStatus(404);
    }
    member.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.sendStatus(204);
    });
  });
};

exports.bulkAdd = function(req, res) {
  var csv = req.body.csv;

  // Remove whitespace and split on newline
  var members = csv.replace(/ /g, '').split(/\n/);

  // Map raw csv to object for manipulation
  members = _.map(members, function(csv) {
    return { raw: csv };
  });

  _.each(members, function(member) {
    var info = member.raw.split(/,/);

    // If we have the correct number of fields, validate each field otherwise
    // set member as invalid
    if (info.length === 3) {
      if (validateEmail(info[0])) {
        member.email = info[0];
      } else {
        member.invalid = true;
      }

      if (validateType(info[1])) {
        member.student = info[1] === 'student';
      } else {
        member.invalid = true;
      }

      if (validateExpirationDate(info[2])) {
        member.expirationDate = info[2];
      } else {
        member.invalid = true;
      }
    } else {
      member.invalid = true;
    }
  });

  var validMembers = _.filter(members, function(member) {
    return !member.invalid;
  })

  var invalidMembers = _.filter(members, function(member) {
    return member.invalid;
  });

  Member.find({ email: { $in: _.map(validMembers, 'email') } }, function(err, members) {
    if (err) {
      return handleError(res, err);
    }

    if (members.length) {
      var matchingEmails = _.map(members, 'email');
      _.remove(validMembers, function(member) {
        return _.contains(matchingEmails, member.email);
      });
    }

    if (validMembers.length) {
      Member.create(validMembers, function(err, members) {
        if (err) {
          return handleError(res, err);
        }

        return res.status(200).json({ valid: members, invalid: invalidMembers });
      });
    } else {
      return res.status(202).json({ valid: [], invalid: invalidMembers });
    }
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

exports.confirmPayment = function(req, res) {
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

        if (member) {
          createPayment(member);
        } else {
          var expirationDate = moment().add(1, 'year');
          if (subscriptionLength === '3') {
            expirationDate = moment().add(3, 'year');
          }

          Member.create({
            email: req.body.email,
            student: isStudent,
            expirationDate: expirationDate,
          }, function(err, member) {
            if (err) {
              // TODO successful payment
              console.log(err);
            }
            createPayment(member);
          });
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

function validateEmail(email) {
  if (!email) {
    return false;
  }

  var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  return re.test(email);
};

function validateType(text) {
  if (!text) {
    return false;
  }

  return text.toLowerCase() === 'student' || text.toLowerCase() === 'yrkesverksam';
};

function validateExpirationDate(expirationDate) {
  if (!expirationDate) {
    return false;
  }

  return moment(expirationDate).isValid();
};

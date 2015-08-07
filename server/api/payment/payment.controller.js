'use strict';

var _ = require('lodash');
var stripe = require('stripe')('sk_test_XYJalXkc7mCuSxM2O5QBILf3');
var moment = require('moment');

var Payment = require('../../models/payment.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');

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

// Get a users single payment
exports.getMyPayment = function(req, res) {
  var userId = req.user._id;
  return getPayment(userId, req, res);
};

// Get a single payment (given Admin Access Control)
exports.getUsersPayment = function(req, res) {
  var userId = req.params.user;
  return getPayment(userId, req, res);
};

function getPayment(userId, req,  res){
  Payment.findOne({_id: req.params.id, user: userId})
    .lean()
    .exec(function (err, payment) {
      if (err) {
        return handleError(res, err);
      }
      if (!payment) {
        return res.sendStatus(404);
      }
      return res.json(payment);
    });
}

// Get a single users payments
exports.getUsersPayments = function(req, res) {
  var userId = req.params.user;
  getPayments(userId, res);
};

// Get the users' payments
exports.getMyPayments = function(req, res) {
  var userId = req.user._id;
  getPayments(userId, res);
};

function getPayments(userId, res){
  Payment.find({user: userId}, function (err, payments) {
    if (err) {
      return handleError(res, err);
    }
    if (!payments) {
      return res.sendStatus(404);
    }
    return res.json(payments);
  });
}

// Creates a new payment in the DB.
exports.createUsersPayment = function(req, res) {
  var userId = req.params.user;
  return createPayment(userId, req, res);
};

// Creates a new payment in the DB.
exports.createMyPayment = function(req, res) {
  var userId = req.user._id;
  return createPayment(userId, req, res);
};

function createPayment(userId, req, res){
  if (req.body.user !== userId) {
    return res.sendStatus(403);
  }
  Payment.create(req.body, function(err, payment) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(201).json(payment);
  });
}

// Updates an existing payment in the DB.
exports.update = function(req, res) {
  var userId = req.user._id;
  if (req.body._id) {
    delete req.body._id;
  }
  Payment.findOne({_id: req.params.id, user: userId})
    .exec(function (err, payment) {
      if (err) {
        return handleError(res, err);
      }
      if (!payment) {
        return res.sendStatus(404);
      }
      var updated = _.merge(payment, req.body);
      updated.save(function (err) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(200).json(payment);
      });
    });
};

// Deletes a payment from the DB.
exports.destroy = function(req, res) {
  Payment.findById(req.params.id, function (err, payment) {
    if (err) {
      return handleError(res, err);
    }
    if (!payment) {
      return res.send(404);
    }
    payment.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.sendStatus(204);
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}

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
  var stripeAmount = amount * 100;

  var chargeSuccessful = false;
  var errorMessage = 'Vi misslyckades med att genomföra din betalning';

  // communicate with stripe
  stripe.charges.create({
    currency: "SEK",
    amount: stripeAmount,
    source: stripeToken.id,
    description: "Membership test charge", // TODO this shows up in the stripe web interface
  }, function(err, charge) {
    if (err === null) {
      chargeSuccessful = true;

      // TODO better text
      var data = {
        from: 'kvitto@ingenjorerutangranser.se',
        to: req.body.email,
        subject: 'Bekräftelse på betalning',
        text: 'Tack för ditt stöd!',
      };

      OutgoingMessage.create(data, function(err, outgoingMessage) {
        if (err) {
          // TODO log error
        }
      });
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
          // TODO what do on successful payment?
          console.log(err);
        }

        var expirationDate = moment().add(1, 'year');
        if (subscriptionLength === '3') {
          expirationDate = moment().add(3, 'year');
        }

        if (member) {
          member.name = req.body.name.trim();
          member.location = req.body.location.trim();
          member.profession = req.body.profession.trim();
          member.telephone = req.body.telephone.replace(/ /g, '');
          member.student = isStudent;

          // Only update expirationDate if it extends the membership
          if (moment(member.expirationDate) < expirationDate) {
            member.expirationDate = expirationDate;
          }

          member.save(function() {
            createPayment(member);
          });
        } else {
          // TODO let database take care of trimming the input
          Member.create({
            name: req.body.name.trim(),
            location: req.body.location.trim(),
            profession: req.body.profession.trim(),
            email: req.body.email,
            telephone: req.body.telephone.replace(/ /g, ''),
            student: isStudent,
            expirationDate: expirationDate
          }, function(err, member) {
            if (err) {
              // TODO successful payment but failed to add member
              // send mail to admins and customer?
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


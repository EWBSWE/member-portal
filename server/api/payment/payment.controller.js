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

      Member.findOne({ email: req.body.email }, function(err, member) {
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
          member.name = req.body.name.trim();
          member.location = req.body.location.trim();
          member.profession = req.body.profession.trim();
          member.telephone = req.body.telephone.replace(/ /g, '');
          member.student = isStudent;

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
              to: process.env.DEV_EMAIL,
              subject: ewbMail.getSubject('renewal'),
              text: ewbMail.getBody('renewal'),
            }
          }

          OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
            if (err) {
              ewbError.create({ message: 'Membership receipt renewal mail', origin: __filename, params: err });
            }
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
              ewbError.create({ message: 'Successful charge create member', origin: __filename, params: err });
              // TODO successful payment but failed to add member
              // send mail to admins and customer?
              console.log(err);
            }
            createPayment(member);

            // Send renewal mail if old member
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
                to: process.env.DEV_EMAIL,
                subject: ewbMail.getSubject('new-member'),
                text: ewbMail.getBody('new-member'),
              }
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

exports.stripeCheckoutKey = function (req, res) {
  var key = '***REMOVED***';
  if (process.env.NODE_ENV === 'production') {
    key = 'pk_live_ATJZnfiF1iDDCQvNK6IgEFA2';
  }
  
  return res.status(200).json({ key: key });
};


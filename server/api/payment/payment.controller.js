'use strict';

var _ = require('lodash');
var Payment = require('./payment.model');

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

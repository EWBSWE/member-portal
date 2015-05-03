'use strict';

var _ = require('lodash');
var Billing = require('./billing.model');

// Get list of billings
exports.index = function(req, res) {
  Billing.find(function (err, billings) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(billings);
  });
};

// Get a single billing
exports.show = function(req, res) {
  Billing.findById(req.params.id, function (err, billing) {
    if(err) { return handleError(res, err); }
    if(!billing) { return res.sendStatus(404); }
    return res.json(billing);
  });
};

// Get a single users billings
exports.getUsersBillings = function(req, res) {
  var userId = req.user._id;
  Billing.find({user: userId}, function (err, billings) {
    if(err) { return handleError(res, err); }
    if(!billings) { return res.sendStatus(404); }
    return res.json(billings);
  });
};

// Creates a new billing in the DB.
exports.create = function(req, res) {
  Billing.create(req.body, function(err, billing) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(billing);
  });
};

// Updates an existing billing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Billing.findById(req.params.id, function (err, billing) {
    if (err) { return handleError(res, err); }
    if(!billing) { return res.sendStatus(404); }
    var updated = _.merge(billing, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(billing);
    });
  });
};

// Deletes a billing from the DB.
exports.destroy = function(req, res) {
  Billing.findById(req.params.id, function (err, billing) {
    if(err) { return handleError(res, err); }
    if(!billing) { return res.send(404); }
    billing.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.sendStatus(204);
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}

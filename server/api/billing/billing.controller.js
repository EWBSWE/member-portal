'use strict';

var _ = require('lodash');
var Billing = require('./billing.model');

// Get list of billings
exports.index = function(req, res) {
  Billing.find(function (err, billings) {
    if(err) { return handleError(res, err); }
    return res.json(200, billings);
  });
};

// Get a single billing
exports.show = function(req, res) {
  Billing.findById(req.params.id, function (err, billing) {
    if(err) { return handleError(res, err); }
    if(!billing) { return res.send(404); }
    return res.json(billing);
  });
};

// Creates a new billing in the DB.
exports.create = function(req, res) {
  Billing.create(req.body, function(err, billing) {
    if(err) { return handleError(res, err); }
    return res.json(201, billing);
  });
};

// Updates an existing billing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Billing.findById(req.params.id, function (err, billing) {
    if (err) { return handleError(res, err); }
    if(!billing) { return res.send(404); }
    var updated = _.merge(billing, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, billing);
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
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
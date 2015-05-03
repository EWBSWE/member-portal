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

// Get a users single billing
exports.getMyBilling = function(req, res) {
  var userId = req.user._id;
  return getBilling(userId, res);
};

// Get a single billing (given Admin Access Control)
exports.getUsersBilling = function(req, res) {
  var userId = req.params.user;
  return getBilling(userId, res);
};

function getBilling(userId, res){
  Billing.findById(req.params.id, function (err, billing) {
    if(err) { return handleError(res, err); }
    if(!billing) { return res.sendStatus(404); }
    if(billing.user !== userId){ return res.sendStatus(403);}
    return res.json(billing);
  });
}

// Get a single users billings
exports.getUsersBillings = function(req, res) {
  var userId = req.params.user;
  getBillings(userId, res);
};

// Get the users' billings
exports.getMyBillings = function(req, res) {
  var userId = req.user._id;
  getBillings(userId, res);
};

function getBillings(userId, res){
  Billing.find({user: userId}, function (err, billings) {
    if(err) { return handleError(res, err); }
    if(!billings) { return res.sendStatus(404); }
    return res.json(billings);
  });
}

// Creates a new billing in the DB.
exports.createUsersBilling = function(req, res) {
  var userId = req.params.user;
  return createBilling(userId, req, res);
};

// Creates a new billing in the DB.
exports.createMyBilling = function(req, res) {
  var userId = req.user._id;
  return createBilling(userId, req, res);
};

function createBilling(userId, req, res){
  if(req.body.user !== userId){ return res.sendStatus(403);}
  Billing.create(req.body, function(err, billing) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(billing);
  });
}

// Updates an existing billing in the DB.
exports.update = function(req, res) {
  var userId = req.user._id;
  if(req.body._id) { delete req.body._id; }
  Billing.findById(req.params.id, function (err, billing) {
    if (err) { return handleError(res, err); }
    if(!billing) { return res.sendStatus(404); }
    if(billing.user !== userId){ return res.sendStatus(403);}
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

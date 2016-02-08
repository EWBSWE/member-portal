'use strict';

var _ = require('lodash');

var ewbError = require('../../models/ewb-error.model');

exports.index = function(req, res) {
  ewbError.find(function (err, ewbErrors) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(ewbErrors);
  });
};

exports.show = function(req, res) {
  ewbError.findOne({ _id: req.params.id }, function(err, ewbe) {
    if (err) {
      return handleError(res, err);
    } else {
      return res.status(200).json(ewbe);
    }
  });
};

'use strict';

var _ = require('lodash');

var moment = require('moment');
var mongoose = require('mongoose');

var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

var ProductHelper = require('./product.helper');

exports.membership = function(req, res) {
    ProductHelper.fetchProducts('Membership', function(err, products) {
        return res.status(200).json(products);
    });
};

exports.ewbEvent = function(req, res) {
    ProductHelper.fetchProducts('Event', function(err, products) {
        return res.status(200).json(products);
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
};

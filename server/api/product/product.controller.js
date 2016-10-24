'use strict';

var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

exports.membership = function(req, res, next) {
    Product.findByProductType(ProductType.MEMBERSHIP).then(products => {
        res.status(200).json(products);
    }).catch(err => {
        next(err);
    });
};

exports.ewbEvent = function(req, res, next) {
    Product.findByProductType(ProductType.EVENT).then(products => {
        res.status(200).json(products);
    }).catch(err => {
        next(err);
    });
};

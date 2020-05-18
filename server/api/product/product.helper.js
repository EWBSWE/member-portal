'use strict';

var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

exports.fetchProducts = fetchProducts;

function fetchProducts(identifier, callback) {
    ProductType.findOne({ identifier: identifier }, function(err, type) {
        if (err) {
            return callback(err);
        }

        Product.find({ type: type._id }, function(err, products) {
            if (err) {
                return callback(err);
            }
            
            return callback(err, products);
        });
    });
};

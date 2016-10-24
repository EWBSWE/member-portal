/**
 * Product controller
 *
 * @namespace Product
 */

'use strict';

var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

/**
 * Returns products that are categorized as membership products. Such products
 * as "Student membership, 1 year" or "Working membership, 3 years"
 *
 * @memberof Product
 *
 * @param {req}
 * @param {res}
 * @param {next}
 */
exports.membership = function(req, res, next) {
    Product.findByProductType(ProductType.MEMBERSHIP).then(products => {
        res.status(200).json(products);
    }).catch(err => {
        next(err);
    });
};

/**
 * Returns products that are categorized as event products.
 *
 * Is this used? TODO Investigate and possibly refactor.
 *
 * @memberof Product
 *
 * @param {req}
 * @param {res}
 * @param {next}
 */
exports.ewbEvent = function(req, res, next) {
    Product.findByProductType(ProductType.EVENT).then(products => {
        res.status(200).json(products);
    }).catch(err => {
        next(err);
    });
};

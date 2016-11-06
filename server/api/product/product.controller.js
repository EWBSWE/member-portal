/**
 * Product controller
 *
 * @namespace controller.Product
 * @memberOf controller
 */

'use strict';

var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

/**
 * Returns products that are categorized as membership products. Such products * as "Student membership, 1 year" or "Working membership, 3 years" *
 *
 * @memberOf controller.Product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.membership = function(req, res, next) {
    ProductType.find(ProductType.MEMBERSHIP).then(pt => {
        return Product.findByProductTypeId(pt.id);
    }).then(products => {
        res.status(200).json(products);
    }).catch(err => {
        next(err);
    });
};

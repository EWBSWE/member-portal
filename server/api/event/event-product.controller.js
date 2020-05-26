/**
 * Event product controller
 *
 * @namespace controller.EventProduct
 * @memberOf controller
 */

"use strict";

var EventProduct = require("../../models/event-product.model");

/**
 * Update event product
 *
 * @memberOf controller.EventProduct
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.update = function (req, res, next) {
  EventProduct.update(req.params.addonId, req.body)
    .then((event) => {
      res.sendStatus(202);
    })
    .catch((err) => {
      next(err);
    });
};

/**
 * Delete event product
 *
 * @memberOf controller.EventProduct
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.destroy = function (req, res, next) {
  EventProduct.destroy(req.params.addonId)
    .then(() => {
      res.sendStatus(204);
    })
    .catch((err) => {
      next(err);
    });
};

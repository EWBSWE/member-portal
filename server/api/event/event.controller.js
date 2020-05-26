/**
 * Event controller
 *
 * @namespace controller.Event
 * @memberOf controller
 */

"use strict";

var Event = require("../../models/event.model");

/**
 * Delete event
 *
 * @memberOf controller.Event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.destroy = function (req, res, next) {
  Event.destroy(req.params.id)
    .then(() => {
      res.sendStatus(204);
    })
    .catch((err) => {
      next(err);
    });
};

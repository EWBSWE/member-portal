/**
 * Event controller
 *
 * @namespace controller.Event
 * @memberOf controller
 */

"use strict";

var Event = require("../../models/event.model");
var EventProduct = require("../../models/event-product.model");
var EventParticipant = require("../../models/event-participant.model");
var Product = require("../../models/product.model");
var ProductType = require("../../models/product-type.model");

/**
 * Create event
 *
 * @memberOf controller.Event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.create = function (req, res, next) {
  if (!req.body.emailTemplate) {
    let badRequest = new Error("Bad request.");
    badRequest.status = 400;
    return next(badRequest);
  }

  var data = {
    name: req.body.name,
    identifier: req.body.identifier,
    description: req.body.description,
    active: req.body.active == 1,
    contact: req.body.contact,
    dueDate: req.body.dueDate,
    emailTemplate: {
      subject: req.body.emailTemplate.subject,
      body: req.body.emailTemplate.body,
    },
    notificationOpen: req.body.notificationOpen == 1,
    subscribers: req.body.subscribers || [],
    addons: req.body.addons,
  };

  Event.create(data)
    .then((event) => {
      res.sendStatus(201);
    })
    .catch((err) => {
      next(err);
    });
};

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

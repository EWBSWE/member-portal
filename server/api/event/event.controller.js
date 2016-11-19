/**
 * Event controller
 *
 * @namespace controller.Event
 * @memberOf controller
 */

'use strict';

var Event = require('../../models/event.model');
var EventProduct = require('../../models/event-product.model');
var EventParticipant = require('../../models/event-participant.model');
var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

/**
 * Responds with all the events.
 *
 * @memberOf controller.Event
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.index = function (req, res, next) {
    Event.index().then(events => {
        res.status(200).json(events);
    }).catch(err => {
        next(err);
    });
};

/**
 * Fetch public event
 *
 * @memberOf controller.Event
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.showPublic = function(req, res, next) {
    Event.findBy({
        identifier: req.query.url,
        active: true,
    }).then(events => {
        if (events.length === 0) {
            return res.sendStatus(404);
        }

        res.status(200).json(events[0]);
    }).catch(err => {
        next(err);
    });
}

/**
 * Fetch event
 *
 * @memberOf controller.Event
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.show = function (req, res, next) {
    Event.get(req.params.id).then(event => {
        if (event === null) {
            return res.sendStatus(404);
        }

        res.status(200).json(event);
    }).catch(err => {
        next(err);
    });
};

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
        let badRequest = new Error('Bad request.');
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

    Event.create(data).then(event => {
        res.sendStatus(201);
    }).catch(err => {
        next(err);
    });
};

/**
 * Update event
 *
 * @memberOf controller.Event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.update = function(req, res, next) {
    let data = {
        name: req.body.name,
        identifier: req.body.identifier,
        description: req.body.description,
        active: req.body.active,
        notificationOpen: req.body.notificationOpen,
        dueDate: req.body.dueDate,
        subscribers: req.body.subscribers,
        emailTemplate: {
            subject: req.body.emailTemplate.subject,
            body: req.body.emailTemplate.body,
        },
    };

    Event.update(req.params.id, data).then(event => {
        res.sendStatus(202);
    }).catch(err => {
        next(err);
    });
};

/**
 * Add participant to event
 *
 * @memberOf controller.Event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.addParticipant = function(req, res, next) {
    let participant = {
        email: req.body.email,
        addonIds: req.body.addonIds,
        message: req.body.message,
    };

    Event.addParticipant(req.params.id, participant).then(() => {
        res.sendStatus(200);
    }).catch(err => {
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
    Event.destroy(req.params.id).then(() => {
        res.sendStatus(204);
    }).catch(err => {
        next(err);
    });
};

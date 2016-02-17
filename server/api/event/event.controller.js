'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Event = require('../../models/event.model');
var EventParticipant = require('../../models/event-participant.model');
var Member = require('../../models/member.model');

var EventHelper = require('./event.helper');

exports.index = function (req, res) {
    return Event.find().exec(function(err, events) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(events);
    });
};

exports.showPublic = function(req, res) {
    return Event.findOne({ 
        identifier: req.query.url, 
        active: true 
    }).lean().exec(function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        if (!ewbEvent) {
            return res.sendStatus(404);
        }

        ewbEvent.remaining = ewbEvent.maxParticipants - ewbEvent.participants.length;

        // Don't send list of participant ids
        delete ewbEvent.participants;

        return res.status(200).json(ewbEvent);
    });
}

exports.show = function (req, res) {
    Event.findById(req.params.id, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }
        if (!ewbEvent) {
            return res.sendStatus(404);
        }
        return res.status(200).json(ewbEvent);
    });
};

exports.create = function (req, res) {
    Event.create({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        active: req.body.active == 1,
        maxParticipants: req.body.maxParticipants,
        contact: req.body.contact,
        dueDate: req.body.dueDate,
    }, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        return res.status(201).json(ewbEvent);
    });
};

exports.update = function (req, res) {
    Event.findById(req.params.id, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        ewbEvent.name = req.body.name;
        ewbEvent.description = req.body.description;
        ewbEvent.price = req.body.price;
        ewbEvent.active = req.body.active == 1;
        ewbEvent.maxParticipants = req.body.maxParticipants;
        ewbEvent.contact = req.body.contact;
        ewbEvent.dueDate = req.body.dueDate;

        ewbEvent.save(function(err) {
            if (err) {
                return handleError(res, err);
            }

            return res.status(202).json(ewbEvent);
        });
    });
};

exports.addParticipant = function (req, res) {
    Event.findById(req.params.id, function (err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }
        if (!ewbEvent) {
            return res.sendStatus(404);
        } else {
            EventHelper.addParticipant(ewbEvent, req.body.email, function (err, result) {
                if (err) {
                    return handleError(res, err);
                }

                return res.status(200).json(result);
            });
        }
    });
};

exports.destroy = function (req, res) {
    Event.findById(req.params.id, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }
        if (!ewbEvent) {
            return res.sendStatus(404);
        }

        ewbEvent.remove(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.sendStatus(204);
        });
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
};


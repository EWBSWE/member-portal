'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Event = require('../../models/event.model');
var EventParticipant = require('../../models/event-participant.model');
var Member = require('../../models/member.model');

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

        // Don't send list of participants
        delete ewbEvent.participants;

        console.log(ewbEvent);

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

        ewbEvent.save(function(err) {
            if (err) {
                return handleError(res, err);
            }

            return res.status(202).json(ewbEvent);
        });
    });
};

exports.addParticipant = function (req, res) {
    Event.findById(req.params.id, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        if (!ewbEvent) {
            return res.sendStatus(404);
        }

        var addToEvent = function(eventId, participantId) {
            Event.update({
                _id: ewbEvent._id,
            }, {
                $addToSet: { participants: participantId },
            }, function(err, result) {
                // If successfully added
                console.log('add to event', result);
                return res.status(200).json(result);
            });
        };

        // If participant exists, find otherwise create
        EventParticipant.findOne({ email: req.body.email }, function(err, participant) {
            if (err) {
                return handleError(res, err);
            }

            if (!participant) {
                // Create participant
                EventParticipant.create({ email: req.body.email }, function(err, newEventParticipant) {
                    if (err) {
                        return handleError(res, err);
                    }

                    addToEvent(ewbEvent._id, newEventParticipant._id);
                });
            } else {
                addToEvent(ewbEvent._id, participant._id);
            }
        });
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
}

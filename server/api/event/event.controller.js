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
        active: req.body.active ? true : false,
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
        
        // TODO 
        Member.findOne({email: 'some-guy@test.com'}, function (err, m) {
            console.log(m, m._id);
            Event.update({ _id: ewbEvent._id }, { $addToSet: { participants: m._id } }, function (err, ewbEvent) {
                console.log('heyoooooo', ewbEvent);
            });
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
        EventParticipant.findOne({ email: req.params.email }, function(err, participant) {
            if (err) {
                return handleError(404);
            }

            if (!participant) {
                // Create participant
                EventParticipant.create({ email: req.params.email }, function(err, newEventParticipant) {
                    if (err) {
                        return handleError(404);
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

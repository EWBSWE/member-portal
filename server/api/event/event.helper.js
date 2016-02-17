'use strict';

var _ = require('lodash');

var Event = require('../../models/event.model');
var EventParticipant = require('../../models/event-participant.model');

exports.fetchEvent = fetchEvent;
exports.addParticipant = addParticipant;

function fetchEvent(identifier, callback) {
    Event.findOne({ identifier: identifier, active: true }, function(err, ewbEvent) {
        return callback(err, ewbEvent);
    });
};

function addParticipant(ewbEvent, maybeParticipant, callback) {
    EventParticipant.findOne({ email: maybeParticipant }, function(err, participant) {
        if (err) {
            return callback(err);
        }

        if (!participant) {
            EventParticipant.create({ email: maybeParticipant }, function(err, participant) {
                if (err) {
                    return callback(err);
                }

                return addToEvent(ewbEvent, participant, callback);
            });
        } else {
            return addToEvent(ewbEvent, participant, callback);
        }
    });
};

function addToEvent(ewbEvent, participant, callback) {
    Event.update({
        _id: ewbEvent._id,
    }, {
        $addToSet: { participants: participant._id },
    }, function(err, result) {
        if (err) {
            return callback(err);
        }

        return callback(err, { email: participant.email });
    });
};

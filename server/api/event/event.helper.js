'use strict';

var _ = require('lodash');

var Event = require('../../models/event.model');
var EventParticipant = require('../../models/event-participant.model');

exports.fetchEvent = fetchEvent;
exports.addParticipantToEvent = addParticipantToEvent;
exports.fetchOrCreateEventParticipant = fetchOrCreateEventParticipant;

function fetchEvent(identifier, callback) {
    Event.findOne({
        identifier: identifier,
        active: true
    }).populate('variants').exec(function(err, ewbEvent) {
        return callback(err, ewbEvent);
    });
};

function addParticipantToEvent(ewbEvent, participant, callback) {
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

function fetchOrCreateEventParticipant(email, callback) {
    EventParticipant.findOne({ email: email }, function(err, maybeParticipant) {
        if (err) {
            return callback(err);
        }

        // Participant found
        if (maybeParticipant) {
            return callback(err, maybeParticipant);
        }

        EventParticipant.create({ email: email }, function(err, participant) {
            if (err) {
                return callback(err);
            }

            return callback(err, participant);
        });
    });
};

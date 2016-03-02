'use strict';

var _ = require('lodash');

var Event = require('../../models/event.model');
var EventAddon = require('../../models/event-addon.model');
var EventParticipant = require('../../models/event-participant.model');

exports.fetchEvent = fetchEvent;
exports.addParticipantToEvent = addParticipantToEvent;
exports.fetchOrCreateEventParticipant = fetchOrCreateEventParticipant;
exports.updateAddons = updateAddons;
exports.sumAddons = sumAddons;

function fetchEvent(identifier, callback) {
    Event.findOne({
        identifier: identifier,
        active: true
    }).populate({
        path: 'addons',
        populate: {
            path: 'product',
        },
    }).exec(function(err, ewbEvent) {
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

function sumAddons(addons) {
    var sum = 0;

    for (var i = 0; i < addons.length; i++) {
        sum += addons[i].product.price;
    }

    return sum;
};

function updateAddons(addonIds, callback) {
    EventAddon.find({
        _id: {
            $in: addonIds,
        }
    }, function(err, addons) {
        if (err) {
            return callback(err);
        }

        EventAddon.update({
            _id: {
                $in: addonIds,
            }
        }, {
            $inc: { capacity: -1 },
        }, {
            multi: true,
        }, function(err, result) {
            return callback(err, result);
        });
    });
};

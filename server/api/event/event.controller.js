'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Event = require('../../models/event.model');
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

};

exports.update = function (req, res) {
    Event.findById(req.params.id, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }
        
        Member.findOne({email: 'some-guy@test.com'}, function (err, m) {
            console.log(m, m._id);
            Event.update({ _id: ewbEvent._id }, { $addToSet: { participants: m._id } }, function (err, ewbEvent) {
                console.log('heyoooooo', ewbEvent);
            });
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

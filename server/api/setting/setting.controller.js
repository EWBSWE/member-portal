'use strict';

var _ = require('lodash');

var moment = require('moment');
var mongoose = require('mongoose');

var Setting = require('../../models/setting.model');

var ewbError = require('../../models/ewb-error.model');

exports.index = function(req, res) {
    Setting.find(function (err, settings) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(settings);
    });
};

/**
 * Might find some use for this in the future, until then though.
 */
exports.create = function(req, res) {
    return res.sendStatus(501);
    //Setting.create({
        //value: req.body.value,
        //description: req.body.description,
    //}, function(err, newSetting) {
        //if (err) {
            //return handleError(res, err);
        //}

        //return res.status(201).json(newSetting);
    //});
};

exports.update = function(req, res) {
    Setting.findById(req.params.id, function(err, maybeSetting) {
        if (err) {
            return handleError(res, err);
        }

        if (!maybeSetting) {
            return res.sendStatus(404);
        }
        
        maybeSetting.value = req.body.value;
        maybeSetting.description = req.body.description;

        maybeSetting.save(function(err, updatedSetting) {
            if (err) {
                return handleError(res, err);
            }

            return res.status(202).json(updatedSetting);
        });
    });
};



function handleError(res, err) {
    return res.status(500).send(err);
};

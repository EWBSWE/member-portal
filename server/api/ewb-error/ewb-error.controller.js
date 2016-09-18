'use strict';

var ewbError = require('../../models/ewb-error.model');

exports.index = function(req, res) {
    ewbError.index().then(data => {
        return res.status(200).json(data);
    }).catch(err => {
        return res.sendStatus(500);
    });
};

exports.show = function(req, res) {
    ewbError.get(req.params.id).then(data => {
        if (!data) {
            return res.sendStatus(404);
        }
        return res.status(200).json(data);
    }).catch(err => {
        return res.sendStatus(500);
    });
};

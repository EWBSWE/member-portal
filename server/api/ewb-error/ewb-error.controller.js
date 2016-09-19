'use strict';

var ewbError = require('../../models/ewb-error.model');

exports.index = function(req, res, next) {
    ewbError.index().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        return next(err);
    });
};

exports.show = function(req, res, next) {
    if (!Number.isInteger(parseInt(req.params.id))) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }
    ewbError.get(req.params.id).then(data => {
        if (!data) {
            let notFound = new Error('No such EWB Error.');
            notFound.status = 404;
            return next(notFound);
        }
        res.status(200).json(data);
    }).catch(err => {
        return next(err);
    });
};

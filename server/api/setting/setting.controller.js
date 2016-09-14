'use strict';

var db = require('../../db').db;

exports.index = function(req, res) {
    db.any(`
        SELECT key, value, description 
        FROM setting
        ORDER BY key
    `).then(data => {
        res.status(200).json(data);
    }).catch(err => {
        res.sendStatus(500);
    });
};

exports.update = function(req, res) {
    if (!req.body.value) {
        return res.sendStatus(400);
    }

    db.one(`
        UPDATE setting
        SET value = $1, description = $2
        WHERE key = $3
        RETURNING *
    `, [req.body.value, req.body.description, req.params.id]).then(data => {
        res.status(200).json(data);
    }).catch(err => {
        res.sendStatus(500);
    });
};

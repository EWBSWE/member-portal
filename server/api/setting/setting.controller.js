/**
 * Settings controller
 *
 * @memberOf controller
 * @namespace controller.Setting
 */

'use strict';

let db = require('../../db').db;
var Setting = require('../../models/setting.model');

/**
 * Get all settings
 *
 * @memberOf controller.Setting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.index = function(req, res, next) {
    Setting.index().then(settings => {
        res.status(200).json(settings);
    }).catch(err => {
        next(err);
    });
};

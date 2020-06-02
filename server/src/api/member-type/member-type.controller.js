/**
 * MemberType controller
 *
 * @namespace controller.MemberType
 * @memberOf controller
 */

'use strict';

var MemberType = require('../../models/member-type.model');

/**
 * Returns all member types.
 *
 * @memberOf controller.MemberType
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {object} next - Express next error function
 */
exports.index = function(req, res, next) {
    MemberType.index().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};

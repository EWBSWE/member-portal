/**
 * Member controller
 *
 * @namespace controller.Member
 * @memberOf controller
 */

'use strict';

var moment = require('moment');
var crypto = require('crypto');

var routeHelper = require('../../helpers/route.helper');

var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var ewbMail = require('../../components/ewb-mail');

/**
 * Returns all members.
 *
 * @memberOf controller.Member
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {object} next - Express next error function
 */
exports.index = function(req, res, next) {
    Member.index().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};

exports.get = function(req, res, next) {
    if (!Number.isInteger(parseInt(req.params.id))) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.get(req.params.id).then(data => {
        if (!data) {
            return res.sendStatus(404);
        }
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};

exports.create = function(req, res, next) {
    if (!req.body.email) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    if (req.body.role) {
        if (req.user.role === 'user' && req.body.role === 'admin') {
            let forbidden = new Error('Forbidden');
            forbidden.status = 403;
            return next(forbidden);
        }

        let randomPassword = crypto.randomBytes(24).toString('hex');
        Member.create({
            email: req.body.email,
            password: randomPassword,
            role: req.body.role
        }).then(member => {
            let url = 'https://blimedlem.ingenjorerutangranser.se/login';
            return OutgoingMessage.create({
                sender: ewbMail.noreply(),
                recipient: member.email,
                subject: ewbMail.getSubject('create-user'),
                body: ewbMail.getBody('create-user', { url: url })
            });
        }).then(() => {
            res.sendStatus(201);
        }).catch(err => {
            next(err);
        });
    } else {
        Member.create(req.body).then(data => {
            res.status(201).json(data);
        }).catch(err => {
            next(err);
        });
    }
};

exports.update = function(req, res, next) {
    if (!req.body) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.update(req.params.id, req.body).then(data => {
        res.status(202).json(data);
    }).catch(err => {
        next(err);
    });
};

exports.destroy = function(req, res, next) {
    Member.get(req.params.id).then(member => {
        if ((member.role === 'admin' || member.role === 'user') && req.user.role !== 'admin') {
            let forbidden = new Error('Forbidden');
            forbidden.status = 403;
            return Promise.reject(forbidden);
        }

        return Member.destroy(req.params.id);
    }).then(() => {
        res.sendStatus(204);
    }).catch(err => {
        next(err);
    });
};

exports.bulkCreate = function(req, res, next) {
    if (!req.body.members) {
        return next(routeHelper.badRequest());
    }

    let roles = req.body.members.map(m => { return m.role });
    if (req.user.role === 'user' && roles.includes('admin')) {
        return res.sendStatus(403);
    }

    let emails = req.body.members.map(m => { return m.email; });

    Member.findBy({ email: emails }).then(members => {
        // First we filter out any existing members
        let existing = members.map(m => { return m.email; });

        // Filter out members that do not exists yet and has valid
        // attributes
        let valid = req.body.members.filter(m => {
            return !existing.includes(m.email) && Member.validate(m);
        });

        // Filter out the remaining invalid members
        let invalid = req.body.members.filter(m => {
            return !Member.validate(m);
        });

        return Member.create(valid).then(created => {
            res.status(201).json({
                existing: existing,
                created: created,
                invalid: invalid,
            });
        });
    }).catch(err => {
        next(err)
    });
};

exports.me = function(req, res, next) {
    let userId = req.user.id;

    if (!userId) {
        let forbidden = new Error('Not signed in.');
        forbidden.status = 403;
        return next(forbidden);
    }

    Member.get(userId).then(member => {
        if (!member) {
            return res.sendStatus(404);
        }

        res.status(200).json(member);
    }).catch(err => {
        next(err);
    });
};

exports.authCallback = function(req, res, next) {
    res.redirect('/')
};

/**
 * Reset password
 *
 * @memberOf controller.Member
 *
 * @param {object} req Request
 * @param {object} res Response
 * @param {object} next Error
 */
exports.resetPassword = function(req, res, next) {
    if (!req.body.email) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.find(req.body.email).then(member => {
        if (!member) {
            return Promise.reject('Member not found');
        }

        return Member.createResetToken(member.id);
    }).then(member => {
        let url = 'http://localhost:9000/reset-password?token=' + member.reset_token;
        if (process.env.NODE_ENV === 'production') {
            // TODO: Fix this URL
            url = 'https://blimedlem.ingenjorerutangranser.se/reset-password?token=' + member.reset_token;
        }

        return OutgoingMessage.create({
            sender: 'noreply@ingenjorerutangranser.se',
            recipient: member.email,
            subject: ewbMail.getSubject('reset-password'),
            body: ewbMail.getBody('reset-password', { url: url }),
        });
    }).then(() => {
        res.sendStatus(202);
    }).catch(err => {
        // Even though we didn't find any member with that email we pretend
        // that we did just to prevent leaking out information about any
        // email addresses that we have or may not have.
        res.sendStatus(202);
    });
};

/**
 * Reset password with token
 *
 * @memberOf controller.Member
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.resetPasswordWithToken = function(req, res, next) {
    if (!req.body.token || !req.body.newPassword) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.findBy({ resetToken: req.body.token }).then(members => {
        if (members.length > 1) {
            return Promise.reject('Token invalid');
        }

        if (members.length === 0) {
            return Promise.reject('No member found');
        }

        let member = members[0];

        if (moment().isAfter(moment(member.reset_validity))) {
            return Promise.reject('Token invalid');
        }

        return Member.update(member.id, { password: req.body.newPassword });
    }).then(member => {
        res.sendStatus(202);
    }).catch(err => {
        next(err);
    });
};

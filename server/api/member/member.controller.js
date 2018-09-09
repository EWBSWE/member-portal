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

const Member = require('../../models/member.model');
var Payment = require('../../models/payment.model');
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
function index(req, res, next) {
    if (req.query.role) {
        Member.findBy({ role: req.query.role }).then(data => {
            res.status(200).json(data);
        }).catch(err => {
            next(err);
        });
    } else {
        Member.index().then(data => {
            res.status(200).json(data);
        }).catch(err => {
            next(err);
        });
    }
};

function get(req, res, next) {
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

function getPayments(req, res, next) {
    Payment.findBy({ memberId: req.params.id }).then(payments => {
        return res.status(200).json(payments);
    }).catch(err => {
        next(err);
    });
};

function create(req, res, next) {
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

        Member.findBy({email: req.body.email }).then(members => {
            if (members.length === 0) {
                return Member.create({
                    email: req.body.email,
                    password: randomPassword,
                    role: req.body.role
                });
            }

            let userOrAdmin = req.body.role === 'admin' ? 'admin' : 'user';

            return Member.update(members[0].id, {role: userOrAdmin}).then(m => {
                return Member.createResetToken(members[0].id);
            });
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
        Member.findBy({email: req.body.email}).then(members => {
            if (members.length > 0) {
                let existingMemberError = new Error('Member exists');
                existingMemberError.status = 400;
                return Promise.reject(existingMemberError);
            }

            return Member.create(req.body);
        }).then(data => {
            res.status(201).json(data);
        }).catch(err => {
            next(err);
        });
    }
};

function update(req, res, next) {
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

function destroy(req, res, next) {
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

function bulkCreate(req, res, next) {
    if (!req.body.members) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    let roles = req.body.members.map(m => { return m.role });
    if (req.user.role === 'user' && roles.includes('admin')) {
        return res.sendStatus(403);
    }

    let emails = req.body.members.map(m => { return m.email; });

    Member.findBy({ email: emails }).then(members => {
        // First we filter out any existing members
        let existingMembers = members.map(m => { return m.email; });

        // Filter out members that do not exists yet and has valid
        // attributes
        let toCreate = req.body.members.filter(m => {
            return !existingMembers.includes(m.email) && Member.validate(m);
        });

        let toUpdate = req.body.members.filter(m => {
            return existingMembers.includes(m.email);
        }).map(m => {
            // Should always find someone since we already filtered out
            // existing members.
            let current = members.filter(c => { return c.email === m.email; })[0];

            // Map id to its respective input
            return Object.assign(m, { id: current.id });
        });

        // Filter out the remaining invalid members
        let toReject = req.body.members.filter(m => {
            return !Member.validate(m);
        });

        return Member.create(toCreate).then(created => {
            let updates = toUpdate.map(m => { return Member.update(m.id, m)});

            return Promise.all(updates);
        }).then(() => {
            res.status(201).json({
                updated: toUpdate,
                created: toCreate,
                invalid: toReject,
            });
        });
    }).catch(err => {
        next(err)
    });
};

function me(req, res, next) {
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

function authCallback(req, res, next) {
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
function resetPassword(req, res, next) {
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
function resetPasswordWithToken(req, res, next) {
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

        return Member.update(member.id, {
            newPassword: req.body.newPassword,
            resetToken: req.body.token
        });
    }).then(member => {
        res.sendStatus(202);
    }).catch(err => {
        next(err);
    });
};

module.exports = {
  index,
  get,
  getPayments,
  create,
  bulkCreate,
  me,
  update,
  destroy,
  authCallback,
  resetPassword,
  resetPasswordWithToken
};

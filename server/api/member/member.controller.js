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


    // If there is a role present then we create an authenticatable member.
    if (req.body.role) {
        if (req.user.role === 'user' && req.body.role === 'admin') {
            let forbidden = new Error('Forbidden');
            forbidden.status = 403;
            return next(forbidden);
        }

        let randomPassword = crypto.randomBytes(24).toString('hex');
        Member.createAuthenticatable(req.body.email, randomPassword, req.body.role).then(member => {
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
    if (!req.body.csv) {
        return next(routeHelper.badRequest());
    }

    let members = csv.replace(/ /g, ' ').split(/\n/);

    throw 'Not implemented yet';
};

//exports.changePassword = function(req, res, next) {
    //if (!req.body.oldPassword || !req.body.newPassword) {
        //let badRequest = new Error('Bad request.');
        //badRequest.status = 400;
        //return next(badRequest);
    //}

    //Member.initiatePasswordChange(req.user._id, req.body.oldPassword, req.body.newPassword).then(() => {
        //res.sendStatus(200);
    //}).catch(err => {
        //next(err);
    //});
//};

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


//exports.bulkAdd = function(req, res) {
  //var csv = req.body.csv;

  //// Remove whitespace and split on newline
  //var members = csv.replace(/ /g, ' ').split(/\n/);

  //// Map raw csv to object for manipulation
  //members = _.map(members, function(csv) {
    //return { raw: csv };
  //});

  //_.each(members, function(member) {
    //var info = member.raw.split(/,/);

    //// If we have the correct number of fields, validate each field otherwise
    //// set member as invalid
    //// 0 name, 1 email, 2 location, 3 profession, 4 education, 5 type, 6 gender, 7 yearOfBirth, 8 expiration
    //if (info.length === 9) {
      //member.name = info[0];

      //if (validateEmail(info[1].trim())) {
        //member.email = info[1].trim();
      //} else {
        //member.invalid = true;
      //}

      //member.location = info[2];
      //member.profession = info[3];
      //member.education = info[4];

      //if (_.contains(['student', 'working', 'senior'], info[5].trim())) {
          //member.type = info[5].trim();
      //} else {
          //member.invalid = true;
      //}

      //if (_.contains(['male', 'female', 'other'], info[6].trim())) {
          //member.gender = info[6].trim();
      //} else {
          //member.invalid = true;
      //}

      //member.yearOfBirth = info[7];

      //if (parseInt(info[8].trim(), 10) > 0) {
          //member.expirationDate = moment().add(parseInt(info[8].trim(), 10), 'days');
      //} else { member.invalid = true; }
    //} else {
      //member.invalid = true;
    //}
  //});

  //// Duplicate emails within collection?
  //var emails = {};
  //_.each(members, function (member) {
    //if (emails[member.email]) {
      //emails[member.email]++;
    //} else {
      //emails[member.email] = 1;
    //}
  //});

  //// Set each member that occurs more than once invalid
  //var duplicateEmails = Object.keys(_.pick(emails, function (v) { return v > 1; }));

  //// Find members with emails that appear more than once
  //_.each(members, function (member) {
    //if (_.contains(duplicateEmails, member.email)) {
      //member.invalid = true;
    //}
  //});

  //var maybeNewMembers = _.filter(members, function(member) {
    //return !member.invalid;
  //});

  //var invalidMembers = _.filter(members, function(member) {
    //return member.invalid;
  //});

  //Member.find({ email: { $in: _.map(maybeNewMembers, 'email') } }, function(err, members) {
    //if (err) {
      //return handleError(res, err);
    //}

    //var updatedMembers = [];

    //if (members.length) {
      //var matchingEmails = _.map(members, 'email');
      //var existingMembers = _.remove(maybeNewMembers, function (member) {
        //return _.contains(matchingEmails, member.email);
      //});

      //_.each(members, function(member) {
        //// Should always return, at least, 1 object. Use the first
        //var newMemberData = _.where(existingMembers, { email: member.email })[0];

        //// Update everything but email
        //member.name = newMemberData.name;
        //member.location = newMemberData.location;
        //member.profession = newMemberData.profession;
        //member.education = newMemberData.education;
        //member.type = newMemberData.type;
        //member.gender = newMemberData.gender;
        //member.yearOfBirth = newMemberData.yearOfBirth;

        //// Never reduce a membership length
        //if (moment(member.expirationDate) < newMemberData.expirationDate) {
            //member.expirationDate = newMemberData.expirationDate;
        //}
        //member.save();
        //updatedMembers.push(member);
      //});
    //}

    //if (maybeNewMembers.length) {
      //Member.create(maybeNewMembers, function(err, members) {
        //if (err) {
          //return handleError(res, err);
        //}

        //return res.status(200).json({ valid: members, invalid: invalidMembers, updated: updatedMembers });
      //});
    //} else {
      //return res.status(202).json({ valid: [], invalid: invalidMembers, updated: updatedMembers });
    //}
  //});
//};

'use strict';

var _ = require('lodash');
var moment = require('moment');

//var Buyer = require('../../models/buyer.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
//var Payment = require('../../models/payment.model');

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
    if (!req.body) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.create(req.body).then(data => {
        res.status(201).json(data);
    }).catch(err => {
        next(err);
    });
};

exports.createAuthenticatable = function(req, res, next) {
    let randomPassword = crypto.randomBytes(24).toString('hex');
    Member.createAuthenticatable(req.body, randomPassword, 'user').then(data => {
        let url = 'https://blimedlem.ingenjorerutangranser.se/login';
        return OutgoingMessage.create({
            sender: ewbMail.noreply(),
            recipient: user.email,
            subject: ewbMail.getSubject('create-user'),
            body: ewbMail.getBody('create-user', { url: url })
        });
    }).then(() => {
        res.sendStatus(201);
    }).catch(err => {
        next(err);
    });
};

exports.update = function(req, res, next) {
    if (!Number.isInteger(parseInt(req.params.id)) || !req.body) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.update(req.params.id, req.body).then(data => {
        res.status(202).json(data);
    }).catch(err => {
        res.sendStatus(500);
    });
};

exports.destroy = function(req, res, next) {
    if (!Number.isInteger(parseInt(req.params.id))) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.destroy(req.params.id).then(data => {
        res.sendStatus(204);
    }).catch(err => {
        next(err);
    });
};

exports.bulkCreate = function(req, res, next) {
    throw 'Not implemented yet';
};

exports.changePassword = function(req, res, next) {
    if (!req.body.oldPassword || !req.body.newPassword) {
        let badRequest = new Error('Bad request.');
        badRequest.status = 400;
        return next(badRequest);
    }

    Member.initiatePasswordChange(req.user._id, req.body.oldPassword, req.body.newPassword).then(() => {
        res.sendStatus(200);
    }).catch(err => {
        next(err);
    });
};

exports.me = function(req, res) {
    
};

exports.authCallback = function(req, res) {
    
};

exports.resetPassword = function(req, res) {
    
};

exports.resetPasswordWithToken = function(req, res) {
    
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

//exports.getPayments = function(req, res) {
    //Buyer.findOne({ type: 'Member', document: req.params.id }, function(err, buyer) {
        //if (err) {
            //return handleError(res, err);
        //}

        //if (!buyer) {
            //return res.sendStatus(404);
        //}

        //Payment.find({ buyer: buyer._id }, function(err, payments) {
            //if (err) {
                //return handleError(res, err);
            //}
            //return res.status(200).json(payments);
        //});
    //});
//};


'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Member = require('../../models/member.model');
var Payment = require('../../models/payment.model');
var moment = require('moment');

exports.index = function(req, res) {
  // Only fetch active members
  Member.find({ expirationDate: { $gt: moment() }}, function(err, members) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(members);
  });
};

exports.show = function(req, res) {
  Member.findOne({ _id: req.params.id }, function(err, member) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(member);
  });
};

exports.create = function(req, res) {
  Member.findOne({ email: req.body.email }, function(err, member) {
    if (err) {
      return handleError(res, err);
    }

    if (member) {
      return res.status(400).json({ message: 'Member exists' });
    } else {
      Member.create({
        name: req.body.name,
        location: req.body.location,
        telephone: req.body.telephone,
        profession: req.body.profession,
        email: req.body.email,
        student: req.body.student,
        expirationDate: req.body.expirationDate
      }, function(err, member) {
        if (err) {
          return handleError(res, err);
        }
        return res.status(201).json(member);
      });
    }
  });
};

exports.update = function(req, res) {
  var memberId = req.params.id;
  Member.findById(memberId, function(err, member) {
    if (err) {
      return handleError(res, err);
    }

    member.name = req.body.name;
    member.location = req.body.location;
    member.telephone = req.body.telephone;
    member.profession = req.body.profession;
    member.email = req.body.email;
    member.student = req.body.student;
    member.expirationDate = req.body.expirationDate;

    member.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(202).json(member);
    });
  });
};

exports.destroy = function(req, res) {
  Member.findById(req.params.id, function(err, member) {
    if (err) {
      return handleError(res, err);
    }
    if (!member) {
      return res.sendStatus(404);
    }
    member.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.sendStatus(204);
    });
  });
};

exports.bulkAdd = function(req, res) {
  var csv = req.body.csv;

  // Remove whitespace and split on newline
  var members = csv.replace(/ /g, ' ').split(/\n/);

  // Map raw csv to object for manipulation
  members = _.map(members, function(csv) {
    return { raw: csv };
  });

  _.each(members, function(member) {
    var info = member.raw.split(/,/);

    // If we have the correct number of fields, validate each field otherwise
    // set member as invalid
    // 0 namn, 1 ort, 2 student, 3 yrke, 4 epost, 5 telefon, 6 langd
    if (info.length === Member.schema._requiredpaths.length) {
      member.name = info[0].trim();
      member.location = info[1].trim();

      if (validateType(info[2])) {
        member.student = info[2] === 'student';
      } else {
        member.invalid = true;
      }

      member.profession = info[3].trim();

      if (validateEmail(info[4].trim())) {
        member.email = info[4].trim();
      } else {
        member.invalid = true;
      }

      member.telephone = info[5].replace(/ /g, '');

      if (parseInt(info[6].trim(), 10) > 0) {
          member.expirationDate = moment().add(parseInt(info[6].trim(), 10), 'days');
      } else {
          member.invalid = true;
      }

      member.invalid = _.some(info, function(field) {
        return field.length === 0;
      });
    } else {
      member.invalid = true;
    }
  });

  var maybeNewMembers = _.filter(members, function(member) {
    return !member.invalid;
  });

  var invalidMembers = _.filter(members, function(member) {
    return member.invalid;
  });

  Member.find({ email: { $in: _.map(maybeNewMembers, 'email') } }, function(err, members) {
    if (err) {
      return handleError(res, err);
    }

    var updatedMembers = [];

    if (members.length) {
      var matchingEmails = _.map(members, 'email');
      var existingMembers = _.remove(maybeNewMembers, function (member) {
        return _.contains(matchingEmails, member.email);
      });

      _.each(members, function(member) {
        // Should always return, at least, 1 object. Use the first
        var newMemberData = _.where(existingMembers, { email: member.email })[0];

        // Update everything but email
        member.name = newMemberData.name;
        member.location = newMemberData.location;
        member.student = newMemberData.student;
        member.profession = newMemberData.profession;
        member.telephone = newMemberData.telephone;

        // Never reduce a membership length
        if (moment(member.expirationDate) < newMemberData.expirationDate) {
            member.expirationDate = newMemberData.expirationDate;
        }
        member.save();
        updatedMembers.push(member);
      });
    }

    if (maybeNewMembers.length) {
      Member.create(maybeNewMembers, function(err, members) {
        if (err) {
          return handleError(res, err);
        }

        return res.status(200).json({ valid: members, invalid: invalidMembers, updated: updatedMembers });
      });
    } else {
      return res.status(202).json({ valid: [], invalid: invalidMembers, updated: updatedMembers });
    }
  });
};

exports.getPayments = function(req, res) {
  Payment.find({ member: new mongoose.Types.ObjectId(req.params.id) }, function(err, payments) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(payments);
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}

function validateEmail(email) {
  if (!email) {
    return false;
  }

  var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  return re.test(email);
}

function validateType(text) {
  if (!text) {
    return false;
  }

  return text.toLowerCase() === 'student' || text.toLowerCase() === 'yrkesverksam';
}

'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var moment = require('moment');

var Buyer = require('../../models/buyer.model');
var Member = require('../../models/member.model');
var Payment = require('../../models/payment.model');

exports.index = function(req, res) {
  if (req.query && Object.keys(req.query).length) {
    // Currently only email
    var params = { email: req.query.email };
    return findMembers(params, res);
  } else {
    // Only fetch active members
    return findMembers({ expirationDate: { $gt: moment() }}, res);
  }
};

exports.show = function(req, res) {
  Member.findOne({ _id: req.params.id }).lean().exec(function(err, member) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(member);
  });
};

exports.getCount = function(req, res) {
  return findMembersCount({}, res);
};

exports.getCountByStudent = function(req, res) {
  var isStudent = req.params.student;
  return findMembersCount({student: isStudent}, res);
};

function findMembers(query, res){
  return Member.find(query).exec(function(err, members) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(members);
  });
}

function findMembersCount(query, res){
  return Member.find(query).count().exec(function(err, count) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(count);
  });
}

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
        profession: req.body.profession,
        education: req.body.education,
        email: req.body.email,
        type: req.body.type,
        gender: req.body.gender,
        yearOfBirth: req.body.yearOfBirth,
        expirationDate: req.body.expirationDate,
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
    member.profession = req.body.profession;
    member.education = req.body.education;
    member.email = req.body.email;
    member.type = req.body.type;
    member.gender = req.body.gender;
    member.yearOfBirth = req.body.yearOfBirth;
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
    // 0 name, 1 email, 2 location, 3 profession, 4 education, 5 type, 6 gender, 7 yearOfBirth, 8 expiration
    if (info.length === 9) {
      member.name = info[0];

      if (validateEmail(info[1].trim())) {
        member.email = info[1].trim();
      } else {
        member.invalid = true;
      }

      member.location = info[2];
      member.profession = info[3];
      member.education = info[4];

      if (_.contains(['student', 'working', 'senior'], info[5].trim())) {
          member.type = info[5].trim();
      } else {
          member.invalid = true;
      }

      if (_.contains(['male', 'female', 'other'], info[6].trim())) {
          member.gender = info[6].trim();
      } else {
          member.invalid = true;
      }

      member.yearOfBirth = info[7];

      if (parseInt(info[8].trim(), 10) > 0) {
          member.expirationDate = moment().add(parseInt(info[8].trim(), 10), 'days');
      } else {
          member.invalid = true;
      }
    } else {
      member.invalid = true;
    }
  });

  // Duplicate emails within collection?
  var emails = {};
  _.each(members, function (member) {
    if (emails[member.email]) {
      emails[member.email]++;
    } else {
      emails[member.email] = 1;
    }
  });

  // Set each member that occurs more than once invalid
  var duplicateEmails = Object.keys(_.pick(emails, function (v) { return v > 1; }));

  // Find members with emails that appear more than once
  _.each(members, function (member) {
    if (_.contains(duplicateEmails, member.email)) {
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
        member.profession = newMemberData.profession;
        member.education = newMemberData.education;
        member.type = newMemberData.type;
        member.gender = newMemberData.gender;
        member.yearOfBirth = newMemberData.yearOfBirth;

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
    Buyer.findOne({ type: 'Member', document: req.params.id }, function(err, buyer) {
        if (err) {
            return handleError(res, err);
        }

        if (!buyer) {
            return res.sendStatus(404);
        }

        Payment.find({ buyer: buyer._id }, function(err, payments) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json(payments);
        });
    });
};

function handleError(res, err) {
  return res.status(500).send(err);
}

// TODO refactor into EmailHelper
function validateEmail(email) {
  if (!email) {
    return false;
  }

  var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  return re.test(email);
}

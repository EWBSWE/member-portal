'use strict';

var _ = require('lodash');

var Member = require('../../models/member.model');

exports.fetchMember = fetchMember;
exports.createMember = createMember;
exports.updateMember = updateMember;

function fetchMember(email, callback) {
    Member.findOne({ email: email }, function(err, member) {
        return callback(err, member);
    });
};

function createMember(data, callback) {
    Member.create(data, function(err, member) {
        return callback(err, member);
    });
};

function updateMember(member, data, callback) {
    Member.findById(member._id, function(err, m) {
        if (err) {
            return callback(err);
        }

        m.name = data.name;
        m.location = data.location;
        m.profession = data.profession;
        m.education = data.education;
        m.gender = data.gender;
        m.yearOfBirth = data.yearOfBirth;
        m.type = data.type;
        m.expirationDate = data.expirationDate;

        m.save(function(err, updatedMember) {
            return callback(err, updatedMember);
        });
    });
};

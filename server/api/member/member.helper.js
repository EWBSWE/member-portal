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
    Member.findByIdAndUpdate(member._id, { 
        $set: {
            name: data.name,
            location: data.location,
            profession: data.profession,
            education: data.education,
            gender: data.gender,
            yearOfBirth: data.yearOfBirth,
            type: data.type,
            expirationDate: data.expirationDate,
        } 
    }, function(err, updateMember) {
        return callback(err, member);
    });
};

'use strict';

const Member = require('../../models/member.model');

/**
 * Responds with an object prepared to display statistics.
 *
 * @memberOf controller.Event
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.members = function (req, res, next) {
    const result = {
        members: {
            total: 0,
            student: 0,
            senior: 0,
            working: 0,
            birthYears: {},
            genders: {
                male: 0,
                female: 0,
                other: 0
            },
            locations: {},
        },
    };

    Member.activeMembers().then(members => {
        members.forEach(member => {
            result.members.total++;
            result.members[member.member_type]++;
            result.members.genders[member.gender]++;

            if (result.members.birthYears[member.year_of_birth] === undefined) {
                result.members.birthYears[member.year_of_birth] = 1;
            } else {
                result.members.birthYears[member.year_of_birth]++;
            }

            if (result.members.locations[member.location] === undefined) {
                result.members.locations[member.location] = 1;
            } else {
                result.members.locations[member.location]++;
            }
        });

        res.status(200).json(result);
    }).catch(err => {
        next(err);
    });
};

'use strict';

const { Member } = require('./Member');

function create(params) {
  return new Member(
    params.id,
    params.email,
    params.name,
    params.location,
    params.education,
    params.profession,
    params.memberTypeId,
    params.gender,
    params.yearOfBirth,
    params.expirationDate,
    params.chapterId,
    params.employer
  );
}


module.exports = {
  create
};

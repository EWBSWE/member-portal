'use strict';

const moment = require('moment');

class Member {
  constructor(id, email, name, location, education, profession, memberTypeId, gender, yearOfBirth, expirationDate, chapterId, employer) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.location = location;
    this.education = education;
    this.profession = profession;
    this.memberTypeId = memberTypeId;
    this.gender = gender;
    this.yearOfBirth = yearOfBirth;
    this.expirationDate = expirationDate;
    this.chapterId = chapterId;
    this.employer = employer;
  }

  extendExpirationDate(days) {
    if (!this.expirationDate) {
      this.expirationDate = new Date();
    }

    this.expirationDate = moment(this.expirationDate)
      .add(days, 'days')
      .toDate();
  }

  isCreatable() {
    // As long as we have an email we're good.
    return !!this.email;
  }

  formatResponse() {
      return {
        id: this.id,
        email: this.email,
        name: this.name,
        location: this.location,
        education: this.education,
        profession: this.profession,
        memberTypeId: this.memberTypeId,
        gender: this.gender,
        yearOfBirth: this.yearOfBirth,
        expirationDate: this.expirationDate,
        chapterId: this.chapterId,
        employer: this.employer
      };
  }
}

module.exports = { Member };

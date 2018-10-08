'use strict';

const moment = require('moment');

class Member {
  constructor(id, email, name, location, education, profession, memberTypeId, gender, yearOfBirth, expirationDate) {
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
  }

  extendExpirationDate(days) {
    if (!this.expirationDate) {
      this.expirationDate = new Date();
    }

    this.expirationDate = moment(this.expirationDate)
      .add(days, 'days')
      .toDate();
  }
}

module.exports = { Member };

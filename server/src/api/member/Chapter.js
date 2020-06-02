'use strict';

class Chapter {
  constructor(id, name, memberTypeId) {
    this.id = id;
    this.name = name;
    this.memberTypeId = memberTypeId;
  }

  formatResponse() {
    return {
      id: this.id,
      name: this.name
    };
  }
}

module.exports = { Chapter };

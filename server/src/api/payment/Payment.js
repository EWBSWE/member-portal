'use strict';

class Payment {
  constructor(id, memberId, currencyCode, amount, createdAt) {
    this.id = id;
    this.memberId = memberId;
    this.currencyCode = currencyCode;
    this.amount = amount;
    this.createdAt = createdAt;
  }
}

module.exports = { Payment };

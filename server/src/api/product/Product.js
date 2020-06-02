'use strict';

class Product {
  constructor(id, name, price, description, productTypeId, currencyCode) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.description = description;
    this.productTypeId = productTypeId;
    this.currencyCode = currencyCode;
  }
}

class MembershipProduct extends Product {
  constructor(id, name, price, description, productTypeId, currencyCode, memberTypeId, membershipDurationDays) {
    super(id, name, price, description, productTypeId, currencyCode);

    this.memberTypeId = memberTypeId;
    this.membershipDurationDays = membershipDurationDays;
  }
}

module.exports = {
  MembershipProduct
};

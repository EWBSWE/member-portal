'use strict';

const Schema = require('../schema');

const PaymentSchema = {
  id: 'id',
  memberId: 'member_id',
  amount: 'amount',
  createdAt: 'created_at',
};

function query(parameters) {
  return Schema.createQuery(PaymentSchema, parameters);
}

module.exports = {
  query
};

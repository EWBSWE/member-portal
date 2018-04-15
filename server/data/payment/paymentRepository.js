'use strict';

const dataStore = require('./paymentDataStore');

async function findMemberPayments(memberId) {
  return dataStore.findWhere({ memberId });
}

async function findMembershipPayments(memberId) {
  return dataStore.findMembershipPayments(memberId);
}

module.exports = {
  findMemberPayments,
  findMembershipPayments,
};

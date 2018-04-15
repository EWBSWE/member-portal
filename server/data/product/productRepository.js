'use strict';

const dataStore = require('./productDataStore');

async function getMemberships() {
  return dataStore.getMemberships();
}

module.exports = {
  getMemberships
};

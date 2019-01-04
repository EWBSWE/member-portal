'use strict';

const Promise = require('bluebird');
const options = {
  promiseLib: Promise,
  query(e) {
    // TODO: toggle query logging by env
    //console.log(e.query);
  }
};
const pgp = require('pg-promise')(options);

const environment = require('../config/environment');

const db = pgp({
    host: environment.db.host,
    port: environment.db.port,
    database: environment.db.database,
    user: environment.db.user,
    password: environment.db.password,
});

module.exports = {
    db: db,
    pgp: pgp,
};

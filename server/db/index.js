'use strict';

var promise = require('bluebird');
var environment = require('../config/environment');

let options = {
    promiseLib: promise,
};

var pgp = require('pg-promise')(options);

let db = pgp({
    host: environment.db.host,
    port: environment.db.port,
    database: environment.db.database,
    user: environment.db.user,
    password: environment.db.password,
});

if (environment.seedDB) {
    console.log('SEEDING');
    // TODO
}

module.exports = {
    db: db,
    pgp: pgp
};

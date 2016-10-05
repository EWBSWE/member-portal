'use strict';

var Promise = require('bluebird');
var pgp = require('pg-promise')({ promiseLib: Promise });
var path = require('path');

var environment = require('../config/environment');

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

function sql(file) {
    return new pgp.QueryFile(path.join(__dirname, file), {minify: true});
}

module.exports = {
    db: db,
    pgp: pgp,
    sql: sql
};

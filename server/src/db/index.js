'use strict'

const options = {
  query: function(e) {
    // TODO: toggle query logging by env
    //console.log(e.query);
  },
  error: function(error, e) {
    console.log(error, e);
    if (e.cn) {
      console.log(`CN: ${e.cn}`);
      console.log(`EVENT: ${error.message || error}`);
    }
  }
}

const pgp = require('pg-promise')(options);

const db = pgp(process.env.DB_URI)

if (process.env.NODE_ENV !== "test") {
  db.func('version')
    .then(version => console.log('Connected to DB'))
    .catch(e => console.log('DB Connection failed'))
}

module.exports = {
  db: db,
  pgp: pgp
}

'use strict';

var path = require('path');

module.exports = {
    env: process.env.NODE_ENV,

    // Root path of server
    root: path.normalize(__dirname + '/../../..'),

    // Server port
    port: process.env.PORT || 9000,

    // Should we populate the DB with sample data?
    seedDB: false,

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'ewb-member-secret'
    },

    // List of user roles
    userRoles: ['guest', 'user', 'admin'],

    db: {
        host: 'localhost',
        port: 5432,
        database: 'ewb',
        user: 'dev',
        password: 'asdf',
    },

    developerMail: 'ict@ingenjorerutangranser.se',
};

'use strict';

const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
    root: path.normalize(__dirname + '/../../..'),
    env: process.env.NODE_ENV,
    port: process.env.PORT || 9000,

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: process.env.EWB_SESSION_SECRET || 'development-secret'
    },

    userRoles: ['guest', 'user', 'admin'],
};

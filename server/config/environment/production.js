'use strict';

// Production specific configuration
// =================================
module.exports = {
    // Server IP
    ip: process.env.OPENSHIFT_NODEJS_IP || process.env.IP || undefined,

    // Server port
    port: process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080,

    db: {
        host: process.env.EWB_DB_HOST,
        port: process.env.EWB_DB_PORT,
        database: process.env.EWB_DB_DATABASE,
        user: process.env.EWB_DB_USER,
        password: process.env.EWB_DB_PASSWORD,
    }
};

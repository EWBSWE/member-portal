/**
 * Main application routes
 *
 * This is where all the API routes are specified.
 *
 * @namespace controller
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

const logger = require('./config/logger');

module.exports = function(app) {
    app.use('/api/members', require('./api/member'));
    app.use('/api/member-types', require('./api/member-type'));
    app.use('/api/events', require('./api/event'));
    app.use('/api/payments', require('./api/payment'));
    app.use('/api/products', require('./api/product'));
    app.use('/api/settings', require('./api/setting'));
    app.use('/api/stats', require('./api/stats'));
    app.use('/api/users', require('./user/UserEndpoints').default);

    app.use('/auth', require('./auth'));

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*').get(function(req, res) {
        res.sendFile('index.html', { root: path.join(__dirname, '../'+app.get('appPath')) });
    });

    const env = app.get('env');
    if (env === 'production') {
        app.use(function(err, req, res, next) {
            logger.error(err);

            res.status(err.status || 500).json({status: 'error', message: err.message});
        });
    }

    if (env === 'development') {
        app.use(function(err, req, res, next) {
            logger.error(err);
            next(err);
        });
        app.use(require('errorhandler')());
    }

    if (env === 'test') {
        // No error middleware
    }
};

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const path = require('path');
const Promise = require('bluebird');
const moment = require('moment');

const OutgoingMessage = require(path.join(__dirname, '../server/models/outgoing-message.model'));
const ewbMail = require(path.join(__dirname, '../server/components/ewb-mail'));
const logger = require(path.join(__dirname, '../server/config/logger'));
const db = require(path.join(__dirname, '../server/db')).db;

const options = {
    from: moment().subtract(1, 'hours').toDate(),
    limit: 200,
};

new Promise((resolve, reject) => {
    logger.query(options, (err, results) => {
        const warns = results.file.filter(l => { return l.level === 'warn'; });
        const errors = results.file.filter(l => { return l.level === 'error'; });

        const messages = errors.concat(warns);

        if (messages.length > 0) {

            const body = messages.map(m => {
                let trace = 'Trace n/a';

                if (m.stack && Array.isArray(m.stack)) {
                    trace = m.stack.join('\n');
                } else if (m.stack) {
                    trace = m.stack;
                }

                return [m.timestamp, m.level, m.message, trace].join('\n');
            });

            return OutgoingMessage.create({
                sender: ewbMail.sender(),
                recipient: 'dan.albin.johansson@gmail.com',
                subject: `ewb: ${errors.length} error(s) - ${warns} warning(s)`,
                body: body.join('\n\n\n')
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        }

        resolve();
    });
}).then(() => {
    process.exit(0);
}).catch(err => {
    logger.error(err);
    process.exit(1);
});


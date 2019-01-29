'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const path = require('path');
const moment = require('moment');

const config = require(path.join(__dirname, '../config/environment'));
const ewbMail = require(path.join(__dirname, '../components/ewb-mail'));
const log = require(path.join(__dirname, '../config/logger'));
const db = require(path.join(__dirname, '../db')).db;


// Fetch members with an expirationDate greater than today but expires within
// a month. This prevents us from fetching expired members.
db.any(`
    SELECT email, expiration_date
    FROM member
    WHERE
        expiration_date BETWEEN NOW() AND NOW() + INTERVAL '1 month'
`).then(members => {
    if (members.length === 0) {
        log.info('No members with expiring memberships.');
        return Promise.resolve();
    }

    return db.task(tx => {
        let queries = members.map(member => {
            let data = {
                sender: ewbMail.sender(),
                recipient: process.env.DEV_MAIL,
                subject: ewbMail.getSubject('expiring'),
                body: ewbMail.getBody('expiring'),
            };

            if (process.env.NODE_ENV === 'production') {
                data.recipient = member.email;
            }

            return tx.none(`
                INSERT INTO outgoing_message (sender, recipient, subject, body)
                VALUES ($[sender], $[recipient], $[subject], $[body])
            `, data);
        });

        return tx.batch(queries);
    });
}).then(batch => {
    if (batch) {
        log.info('Successfully created ' + batch.length + ' reminder(s) for expiring membership(s).');
    }

    process.exit(0);
}).catch(err => {
    log.error(err);
    process.exit(1);
});

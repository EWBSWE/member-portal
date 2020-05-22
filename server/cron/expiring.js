'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const path = require('path');
const moment = require('moment');

require('dotenv')
  .config({
    path: path.resolve(__dirname, '../../env')
  });

const config = require(path.join(__dirname, '../config/environment'));
const ewbMail = require(path.join(__dirname, '../components/ewb-mail'));
const log = require(path.join(__dirname, '../config/logger'));
const db = require(path.join(__dirname, '../db')).db;


const subject = "Your membership will soon end";
const body = `Hello,

you receive this email because your membership soon expires and we would like to see that you would continue to support our organization. Your contribution and involvement is a part of the growth that Engineers without borders has reached over the last year. Both active and supporting members are very important since it allows us to continue our work as a non-profit organization.

If you wish to extend your membership, follow the instructions at http://blimedlem.ingenjorerutangranser.se/fornya-medlemskap.

If you have any questions or thoughts, don't hesitate to get in touch with us.

Thank you for your contribution.

Follow us on Facebook and Twitter!
http://www.facebook.com/ingenjorerutangranser?fref=ts
https://twitter.com/EWB_Ingenjorer

Kind regards,
Engineers without borders
www.ewb-swe.org
info@ewb-swe.org`;


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
                subject: subject,
                body: body,
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

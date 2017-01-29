'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const path = require('path');
const moment = require('moment');

const config = require(path.join(__dirname, '../server/config/environment'));
const ewbMail = require(path.join(__dirname, '../server/components/ewb-mail'));
const log = require(path.join(__dirname, '../server/config/logger'));
const db = require(path.join(__dirname, '../server/db')).db;

const Event = require(path.join(__dirname, '../server/models/event.model'));

db.any(`
    SELECT id
    FROM event
    WHERE event.active
`).then(activeEventIds => {
    if (activeEventIds.length === 0) {
        log.info('No active events');
        process.exit(0);
    }

    let events = map.activeEventIds(id => {
        return Event.get(id);
    });

    return Promise.all(events);
}).then(events => {
    let mails = [];

    events.forEach(e => {
        if (e.subscribers.length === 0) {
            log.info('No subscribers for ' + e.identifier);
            return;
        }

        //<tr ng-repeat="payment in ev.payments">
            //<td>{{payment.name}}</td>
            //<td>{{payment.email}}</td>
            //<td>{{payment.amount}} kr</td>
            //<td>{{joinProducts(payment.addons)}}</td>
            //<td>{{payment.message}}</td>
        //</tr>
        let eventSummary = 'Inga anmälningar';
        if (e.payments.length > 0) {
            let eventAddonIds = e.addons.map(a => { return a.product_id; });

            eventSummary += e.payments.map(p => {
                // TODO
                p.

                let productNames = e.addons.filter(a => {
                    return eventAddonsIds.includes(a.product_id);
                }).map(a => { return a.name; }).join(', ');

                return `${p.name} | ${p.email} | ${p.amount} | ${productNames} | ${p.message}`;
            }).join('\n');
        }

        e.subscribers.forEach(s => {
            mails.push({
                sender: ewbMail.noreply(),
                recipient: s.email,
                subject: e.name + ' - ' + moment().format('YYYY-MM-DD'),
                body: eventSummary,
            });
        });
    });

    if (mails.length === 0) {
        log.info('No messages generated.');
        process.exit(0);
    }

    return db.task(tx => {
        let queries = mails.map(m => {
            return tx.none(`
                INSERT INTO outgoing_message (sender, recipient, subject, body)
                VALUES ($[sender], $[recipient], $[subject], $[body])
            `);
        });

        return tx.batch(queries);
    });
}).then(messages => {
    log.info('Queued ' + messages.length + ' message(s).');
    process.exit(0);
}).catch(err => {
    log.error(err);
    process.exit(1);
});

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
`).then(activeEvents => {
    if (activeEvents.length === 0) {
        log.info('No active events');
        process.exit(0);
    }

    let events = activeEvents.map(e => {
        return Event.get(e.id);
    });

    return Promise.all(events);
}).then(events => {
    let mails = [];

    events.forEach(e => {
        if (e.subscribers.length === 0) {
            log.info('No subscribers for ' + e.identifier);
            return;
        }

        let eventSummary = 'Inga anmälningar';
        if (e.payments.length > 0) {
            eventSummary = 'Namn | Epost | Betalt (SEK) | Val | Meddelande\n\n';
            eventSummary += e.payments.map(p => {
                let products = e.addons.filter(a => {
                    return p.addons.includes(a.product_id);
                });

                let productNames = products.map(product => {
                    return product.name;
                }).join(', ');

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
            `, m);
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

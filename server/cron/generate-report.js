'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const path = require('path');
const moment = require('moment');
const Promise = require('bluebird');

const config = require(path.join(__dirname, '../config/environment'));
const log = require(path.join(__dirname, '../config/logger'));
const ewbMail = require(path.join(__dirname, '../components/ewb-mail'));
const db = require(path.join(__dirname, '../db')).db;

const Payment = require(path.join(__dirname, '../models/payment.model'));
const Setting = require(path.join(__dirname, '../models/setting.model'));

Setting.findBy({
    key: ['StripeTransferDate', 'StripeTransferEmails']
}).then(settings => {
    if (settings.length !== 2) {
        log.error('Expected to find settings StripeTransferDate and StripeTransferEmails');
        process.exit(1);
    }

    const stripeTransferDate = settings.filter(s => { return s.key === 'StripeTransferDate'})[0];
    const stripeTransferEmails = settings.filter(s => { return s.key === 'StripeTransferEmails'})[0];

    // Example
    // {
    //   periodStart: 2016-04-14,
    //   periodEnd:   2016-05-13
    // }
    const params = {
        periodStart: moment().date(stripeTransferDate.value).subtract(1, 'month'),
        periodEnd: moment().date(stripeTransferDate.value).subtract(1, 'day'),
    };

    return Payment.generateReport(params.periodStart, params.periodEnd).then(report => {
        const period = `Period: ${params.periodStart.startOf('day').format('YYYY-MM-DD HH:mm:ss')} - ${params.periodEnd.endOf('day').format('YYYY-MM-DD HH:mm:ss')}`;

        const mails = stripeTransferEmails.value.split(/,/).map(recipient => {
            return {
                sender: ewbMail.sender(),
                recipient: recipient,
                subject: `EWB Report: ${params.periodStart.format('YYYY-MM-DD')} - ${params.periodEnd.format('YYYY-MM-DD')}`,
                body: report,
            };
        });

        return db.task(tx => {
            const queries = mails.map(m => {
                return db.none(`
                    INSERT INTO outgoing_message (sender, recipient, subject, body)
                    VALUES ($[sender], $[recipient], $[subject], $[body])
                `, m);
            });

            return tx.batch(queries);
        });
    });
}).then(mails => {
    log.info(`Generated report and queued ${mails.length} message(s).`);
    process.exit(0);
}).catch(err => {
    log.error(err);
    process.exit(1);
});

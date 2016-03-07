'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var _ = require('lodash');
var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));

var ewbError = require(path.join(__dirname, '../server/models/ewb-error.model'));
var OutgoingMessage = require(path.join(__dirname, '../server/models/outgoing-message.model'));
var Setting = require(path.join(__dirname, '../server/models/setting.model'));

var PaymentHelper = require(path.join(__dirname, '../server/api/payment/payment.helper'));
var ewbMail = require(path.join(__dirname, '../server/components/ewb-mail'));

var moment = require('moment');

var mailgun;
if (process.env.NODE_ENV === 'production') {
    mailgun = require('mailgun-js')({
        apiKey: '***REMOVED***',
        domain: 'blimedlem.ingenjorerutangranser.se',
    });
} else {
    mailgun = require('mailgun-js')({
        apiKey: '***REMOVED***',
        domain: '***REMOVED***',
    });
}

mongoose.connect(config.mongo.uri, config.mongo.options);

Setting.findOne({
    key: 'StripeTransferDate'
}, function(err, setting) {
    if (err) {
        ewbError.create({ message: 'Fetch setting', origin: __filename, params: err }, function (err, data) {
            process.exit(1);
        });
    }

    var params = {
        periodStart: moment().date(setting).subtract(1, 'month'),
        periodEnd: moment().date(setting),
    };


    Setting.findOne({
        key: 'StripeTransferEmails',
    }, function(err, emailSetting) {
        if (err) {
            ewbError.create({ message: 'Fetch email setting', origin: __filename, params: err }, function (err, data) {
                process.exit(1);
            });
        }

        PaymentHelper.generateReport({
            periodStart: params.periodStart.format('YYYY-MM-DD'),
            periodEnd: params.periodEnd.format('YYYY-MM-DD'),
        }, function(err, data) {
            if (err) {
                ewbError.create({ message: 'Generate report', origin: __filename, params: err }, function (err, data) {
                    process.exit(1);
                });
            }

            var text = PaymentHelper.formatReport(data);

            var mails = _.map(emailSetting.split(/,/), function(recipient) {
                return {
                    from: ewbMail.sender(),
                    to: recipient,
                    subject: 'EWB Report: ' + params.periodStart.format('YYYY-MM-DD') + ' - ' + params.periodEnd.format('YYYY-MM-DD'),
                    text: text,
                };
            });

            OutgoingMessage.create(mails, function(err, outgoingMessage) {
                if (err) {
                    ewbError.create({ message: 'Failed to create report mail', origin: __filename, params: err });
                }

                console.log('Queued message(s)');
                process.exit(0);
            });
        });
    });
});

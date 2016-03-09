'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var _ = require('lodash');
var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));

var ewbError = require(path.join(__dirname, '../server/models/ewb-error.model'));
var OutgoingMessage = require(path.join(__dirname, '../server/models/outgoing-message.model'));
var Event = require(path.join(__dirname, '../server/models/event.model'));

var EventHelper = require(path.join(__dirname, '../server/api/event/event.helper'));
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

Event.find({
    active: true
}).populate([{
    path: 'participants',
    populate: {
        path: 'payments'
    }
}, {
    path: 'addons',
    populate: {
        path: 'product'
    }
}, {
    path: 'payments',
    populate: {
        path: 'buyer',
        populate: {
            path: 'document',
            model: 'EventParticipant',
        },
    },
}]).exec(function(err, ewbEvents) {
    if (err) {
        ewbError.create({ message: 'Fetch active events', origin: __filename, params: err }, function (err, data) {
            process.exit(1);
        });
    }

    var eventsWithSubscribers = _.filter(ewbEvents, function(e) {
        return e.subscribers.length > 0;
    });

    if (eventsWithSubscribers.length === 0) {
        console.log('Nothing to do');
        process.exit(0);
    }

    var mails = [];

    _.each(eventsWithSubscribers, function(ewbEvent) {
        var mail = {
            from: ewbMail.noreply(),
            to: ewbEvent.subscribers.join(','),
            subject: ewbEvent.name + ' - ' + moment().format('YYYY-MM-DD'),
        };

        if (ewbEvent.payments.length) {
            var summary = EventHelper.generateSummary(ewbEvent);
            mail.text = EventHelper.formatSummary(summary);
        } else {
            mail.text = 'Inga anmälningar';
        }

        mails.push(mail);
    });

    OutgoingMessage.create(mails, function(err, outgoingMessages) {
        if (err) {
            ewbError.create({ message: 'Failed to create report mail', origin: __filename, params: err });
            process.exit(1);
        }

        console.log('Queued ' + outgoingMessages.length + ' message(s)');
        process.exit(0);
    });
});

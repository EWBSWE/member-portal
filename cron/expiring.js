'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));
var Member = require(path.join(__dirname, '../server/models/member.model'));
var OutgoingMessage = require(path.join(__dirname, '../server/models/outgoing-message.model'));
var moment = require('moment');
var iugMail = require(path.join(__dirname, '../server/components/iug-mail'));

mongoose.connect(config.mongo.uri, config.mongo.options);

// Fetch members with an expirationDate greater than today but expires within
// a month. This prevents us from fetching expired members.
Member.find({ expirationDate: { $lt: moment().add(1, 'month'), $gt: moment() } }, function(err, members) {
    console.log('query', err, members);
    if (err) {
        // Exit with failure code
        process.exit(1);
    }

    if (members.length) {
        var outgoingMessages = [];
        for (var i = 0; i < members.length; i++) {
            var member = members[i];

            if (process.env.NODE_ENV === 'production') {
                var data = {
                    from: iugMail.sender(),
                    to: member.email,
                    subject: iugMail.getSubject('expiring'),
                    text: iugMail.getBody('expiring'),
                };
            } else {
                var data = {
                    from: iugMail.sender(),
                    to: process.env.DEV_MAIL,
                    subject: iugMail.getSubject('expiring'),
                    text: iugMail.getBody('expiring'),
                };
            }

            outgoingMessages.push(data);
        }

        OutgoingMessage.create(outgoingMessages, function() {
            var err = arguments[0];
            if (err) {
                process.exit(1);
            }

            for (var i = 1; i < arguments.length; i++) {
                var message = arguments[i];
                console.log(message);
            }

            process.exit();
        });
    } else {
        process.exit();
    }
});

'use strict';

// TODO set absolute path before cron

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var config = require('../server/config/environment');

var Member = require('../server/api/member/member.model');
var OutgoingMessage = require('./outgoing-message.model');

var moment = require('moment');
var mailgun = require('mailgun-js')({apiKey: 'key-a84831826d3c3bd17d42855f08fba084', domain: 'sandboxcbadc25cc29f4237a9b52f88691afe42.mailgun.org' });

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
            // TODO fix text
            var data = {
                from: 'noreply@ingenjorerutangranser.se',
                to: 'dan.albin.johansson@gmail.com',
                subject: 'Ditt medlemskap går ut snart',
                text: 'Test message ' + member.name,
            };

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
    }
});

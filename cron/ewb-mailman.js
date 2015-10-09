'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));

var Member = require(path.join(__dirname, '../server/models/member.model'));
var OutgoingMessage = require(path.join(__dirname, '../server/models/outgoing-message.model'));
var ewbError = require(path.join(__dirname, '../server/models/ewb-error.model'));

var moment = require('moment');
var mailgun = require('mailgun-js')({apiKey: '***REMOVED***', domain: '***REMOVED***' });

mongoose.connect(config.mongo.uri, config.mongo.options);

OutgoingMessage
    .find({ sendAt: { $lt: moment() } })
    .sort({ priority: 'descending' })
    .limit(10)
    .exec(function(err, outgoingMessages) {
        if (err) {
            ewbError.create({ message: 'Fetch outgoing messages', origin: __filename, params: err }, function (err, data) {
                process.exit(1);
            });
        }

        if (outgoingMessages.length) {
            console.log('Messages found:', outgoingMessages.length);
            var mailInterval = setInterval(function() {
                console.log('Messages left:', outgoingMessages.length);
                if (outgoingMessages.length) {
                    var message = outgoingMessages.shift();
                    mailgun.messages().send(message, function(error, body) {
                        if (error) {
                            console.log('Mailgun error', error);
                            message.failedAttempts++;
                            message.sendAt = moment().add(message.failedAttempts, 'minutes');
                            message.save();
                        } else {
                            console.log(body);
                            message.remove();
                        }
                    });
                } else {
                    console.log('No messages left in queue');
                    clearInterval(mailInterval);
                    process.exit(0);
                }
            }, 3000);
        } else {
            console.log('No messages in queue');
            process.exit(0);
        }
    });

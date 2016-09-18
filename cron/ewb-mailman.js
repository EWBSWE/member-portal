'use strict';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

//var mongoose = require('mongoose');
var path = require('path');
var moment = require('moment');
var Promise = require('bluebird');

var config = require(path.join(__dirname, '../server/config/environment'));

var OutgoingMessage = require(path.join(__dirname, '../server/models/outgoing-message.model'));
var ewbError = require(path.join(__dirname, '../server/models/ewb-error.model'));

var mailgun = require('mailgun-js')({
    apiKey: '***REMOVED***',
    domain: '***REMOVED***',
});
if (process.env.NODE_ENV === 'production') {
    mailgun = require('mailgun-js')({
        apiKey: '***REMOVED***',
        domain: 'blimedlem.ingenjorerutangranser.se',
    });
}

var numberOfMessages = 2;

OutgoingMessage.fetch(numberOfMessages).then(data => {
    if (data.length === 0) {
        return Promise.resolve('No messages in queue');
    }

    return Promise.all(data.map(message => {
        return new Promise((resolve, reject) => {
            let mailgunMessage = {
                to: message.recipient,
                from: message.sender,
                subject: message.subject,
                text: message.body
            };

            mailgun.messages().send(mailgunMessage, (err, body) => {
                if (err) {
                    OutgoingMessage.fail(message.id).then(() => {
                        reject(err);
                    }).catch(err => {
                        reject(err);
                    });
                } else {
                    OutgoingMessage.remove(message.id).then(() => {
                        resolve(body);
                    }).catch(err => {
                        reject(err);
                    });
                }
            });
        });
    }));
}).then(() => {
    console.log('All done!');
    process.exit(0);
}).catch(err => {
    ewbError.create('Mailman', __filename, err).then(() => {
        process.exit(1);
    }).catch(() => {
        // Can't do anything sensible if our error logging crashes so just quit
        process.exit(2);
    });
});

'use strict';

const path = require('path');

require('dotenv')
  .config({
    path: path.resolve(__dirname, '../.env')
  });

const mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

const OutgoingMessage = require('../models/outgoing-message.model');
const log = require('../config/logger');

const BATCH_SIZE = 5;

OutgoingMessage.fetch(BATCH_SIZE).then(messages => {
  if (messages.length === 0) {
    return Promise.resolve('No messages in queue');
  }

  return Promise.all(messages.map(message => {
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
  log.info('All done!');
  process.exit(0);
}).catch(err => {
  log.error(err);
  process.exit(1);
});

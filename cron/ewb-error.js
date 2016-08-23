'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));

var OutgoingMessage = require(path.join(__dirname, '../server/models/outgoing-message.model'));
var ewbError = require(path.join(__dirname, '../server/models/ewb-error.model'));

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

ewbError.find({ createdAt: { $gt: moment().subtract(1, 'day') } }, function(err, ewbErrors) {
    if (err) {
        ewbError.create({ message: 'Fetch ewb errors', origin: __filename, params: err }, function (err, data) {
            // Exit with failure code
            process.exit(1);
        });
    }

    if (ewbErrors.length) {
        var errorMessages = ewbErrors.map(function(e) {
            return e.message;
        });

        var text = 'Since: ' + moment().subtract(1, 'day').format() + '\n\n' + errorMessages.join('\n');

        var data = {
            from: 'noreply@ingenjorerutangranser.se',
            to: 'ict@ingenjorerutangranser.se',
            subject: 'ewb-member: ' + ewbErrors.length + ' errors',
            text: text,
        };

        OutgoingMessage.create(data, function() {
            var err = arguments[0];
            if (err) {
                process.exit(1);
            }

            for (var i = 1; i < arguments.length; i++) {
                var message = arguments[i];
                console.log(message);
            }

            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

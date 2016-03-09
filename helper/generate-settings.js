process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));

var Setting = require(path.join(__dirname, '../server/models/setting.model'));

mongoose.connect(config.mongo.uri, config.mongo.options);

Setting.create([{
    key: 'StripeTransferDate',
    value: '20',
    description: 'Day in month that money is transferred from Stripe to EWB. If value is 22 then that counts as YYYY-MM-22 00:00:00.'
}, {
    key: 'StripeTransferEmails',
    value: 'ict@ingenjorerutangranser.se',
    description: 'A list of comma separated email addresses formatted as "foo@bar.se,bar@baz.com". This list of people will receive a copy of the monthly transactions',
}, {
    key: 'StripeTransactionFeePercent',
    value: '0.014',
    description: 'Stripe transaction fee, as a floating point number. For instance 0.014 is equivalent to 1.4% of each transaction.',
}, {
    key: 'StripeTransactionFeeFlat',
    value: '1.8',
    description: 'Stripe flat fee per transaction, in SEK. For instance, Stripe charge 1.8 SEK per transaction.',
}], function(err, settings) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(settings);
    process.exit(0);
});

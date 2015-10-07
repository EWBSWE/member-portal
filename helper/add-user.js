process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var path = require('path');
var config = require(path.join(__dirname, '../server/config/environment'));
var User = require(path.join(__dirname, '../server/models/user.model'));

mongoose.connect(config.mongo.uri, config.mongo.options);

var email = process.argv[2];
var password = process.argv[3];
var role = process.argv[4];

if (!email && !password) {
    console.log('Usage: node add-user.js <email> <password> <role>');
    process.exit(1);
}

User.create({ email: email, password: password, role: role }, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1)
    }
    console.log(data);
    process.exit(0);
});



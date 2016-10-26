'use strict';

let path = require('path');

let Member= require(path.join(__dirname, '../server/models/member.model'));

let email = process.argv[2];
let password = process.argv[3];
let role = process.argv[4];

let user = Member.createAuthenticatable(email, password, role);

user.then(data => {
    console.log(data);
    process.exit(0);
}).catch(err => {
    console.log(err);
    process.exit(1);
});

/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../models/user.model');
var Member = require('../models/member.model');
var Payment = require('../models/payment.model');
var OutgoingMessage = require('../models/outgoing-message.model');

var iugMail = require('../components/iug-mail');

OutgoingMessage.find().remove(function() {
  console.log('Removing outgoing messages..');
  OutgoingMessage.create({
    from: iugMail.sender(),
    to: 'dan.albin.johansson@gmail.com', 
    subject: iugMail.getSubject('expiring'),
    text: iugMail.getBody('expiring'),
  }, {
    from: iugMail.sender(),
    to: 'dan.albin.johansson@gmail.com', 
    subject: iugMail.getSubject('renewal'),
    text: iugMail.getBody('renewal'),
    priority: 1,
  }, function() {
    console.log('Finished populating outgoing messages');
  })
});

User.find({}).remove(function() {
  User.create({
    provider: 'local',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
    password: 'test'
  }, {
    provider: 'local',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Admin',
    email: 'admin@admin.com',
    password: 'admin'
  }, function() {
      console.log('Finished populating users');
      createPayments();
    }
  );
});

Member.find({}).remove(function() {
  Member.create({
    name: 'Some Guy',
    location: 'Somewhere',
    student: true,
    profession: 'Mapper',
    email: 'some-guy@test.com',
    telephone: '+46123456789'
  }, {
    name: 'Arne Testman',
    location: 'Tensta',
    student: false,
    profession: 'President',
    email: 'arne_testman@test.com',
    telephone: '+46123456790'
  });
});

function createPayments() {
  var testMember;
  Payment.find({}).remove(function() {
    console.log('Remove payments..');
  });

  Member.findOne({email: 'some-guy@test.com'}, function(err, member) {
    testMember = member;
    addPayments();
  });

  Member.findOne({email: 'arne_testman@test.com'}, function(err, member) {
    testMember = member;
    addPayments();
  });

  var addPayments = function() {
    Payment.create({
      member: testMember,
      amount: 100,
      currency: 'SEK'
    }, function() {
      console.log('Payments done!');
    });
  };
}

/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var moment = require('moment');

var User = require('../models/user.model');
var Member = require('../models/member.model');
var Payment = require('../models/payment.model');
var OutgoingMessage = require('../models/outgoing-message.model');
var Event = require('../models/event.model');

var ewbMail = require('../components/ewb-mail');

OutgoingMessage.find().remove(function() {
  console.log('Removing outgoing messages..');
  OutgoingMessage.create({
    from: ewbMail.sender(),
    to: 'dan.albin.johansson@gmail.com', 
    subject: ewbMail.getSubject('expiring'),
    text: ewbMail.getBody('expiring'),
  }, {
    from: ewbMail.sender(),
    to: 'dan.albin.johansson@gmail.com', 
    subject: ewbMail.getSubject('renewal'),
    text: ewbMail.getBody('renewal'),
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
    type: 'student',
    education: 'Yes',
    yearOfBirth: 1980,
    profession: 'Mapper',
    gender: 'male',
    email: 'some-guy@test.com',
  }, {
    name: 'Gunde Svan',
    location: 'Mora',
    type: 'working',
    education: 'Yes',
    yearOfBirth: 1800,
    profession: 'President',
    gender: 'male',
    email: 'gundesvan@test.com',
  }, {
    name: 'Arne Testman',
    location: 'Tensta',
    type: 'working',
    education: 'Yes',
    yearOfBirth: 1800,
    profession: 'President',
    gender: 'male',
    email: 'arne_testman@test.com',
  }, {
    name: 'Old member 1',
    location: 'Old Town',
    type: 'senior',
    education: 'Yes',
    yearOfBirth: 1800,
    profession: 'President',
    email: 'oldmember1@test.com',
    gender: 'female',
    createdAt: moment().subtract(3, 'month'),
    expirationDate: moment().subtract(1, 'month'),
  }, {
    name: 'Old member 2',
    location: 'Old Town',
    type: 'senior',
    education: 'No',
    yearOfBirth: 1800,
    profession: 'President',
    gender: 'other',
    email: 'oldmember2@test.com',
    createdAt: moment().subtract(3, 'month'),
    expirationDate: moment().subtract(1, 'month'),
  });


  var lotsOfMembers = [];
  for (var i = 0; i < 10000; i++) {
    lotsOfMembers.push({
      name: 'Name ' + i,
      location: 'Location',
      type: 'working',
      yearOfBirth: 1900,
      gender: 'other',
      education: 'Maybe',
      profession: 'Profession',
      email: 'name' + i + '@example.com',
      createdAt: moment().subtract(3, 'month'),
    });
  }
  Member.create(lotsOfMembers);
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

Event.find({}).remove(function () {
    Event.create({
        name: 'Event 1',
        description: 'Lorem ipsum',
        price: '100',
        active: true,
        participants: [],
    });

    Event.create({
        name: 'Event 2',
        description: 'Lorem ipsum',
        price: '300',
        active: true,
        participants: [],
    });
});

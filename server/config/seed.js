/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');
var Member = require('../api/member/member.model');
var Payment = require('../api/payment/payment.model');

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
    telephone: '+46123456789',
  }, {
    name: 'Arne Testman',
    location: 'Tensta', 
    student: false,
    profession: 'President',
    email: 'arne_testman@test.com',
    telephone: '+46123456790',
  });
});

var createPayments = function() {
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
      currency: 'SEK',
    }, function() {
      console.log('Payments done!');
    });
  };
};

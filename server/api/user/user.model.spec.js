'use strict';

var should = require('should');
var app = require('../../app');
var User = require('./user.model');

var user = new User({});
var initUser = function() {
  user.provider = 'local',
  user.firstName = 'Fake',
  user.lastName = 'User',
  user.email = 'test@test.com',
  user.password = 'password'
}

describe('User Model', function() {
  before(function(done) {
    initUser();
    // Clear users before testing
    User.remove().exec().then(function() {
      done();
    });
  });

  afterEach(function(done) {
    initUser();
    User.remove().exec().then(function() {
      done();
    });
  });

  it('should begin with no users', function(done) {
    User.find({}, function(err, users) {
      users.should.have.length(0);
      done();
    });
  });

  it('should fail when saving a duplicate user', function(done) {
    user.save(function() {
      var userDup = new User(user);
      userDup.save(function(err) {
        should.exist(err);
        done();
      });
    });
  });

  it('should fail when saving without an email', function(done) {
    user.email = '';
    user.save(function(err) {
      should.exist(err);
      done();
    });
  });

  it('should fail when saving without a firstName', function(done) {
    user.firstName = '';
    user.save(function(err) {
      should.exist(err);
      done();
    });
  });

  it('should fail when saving without a last name', function(done) {
    user.lastName = '';
    user.save(function(err) {
      should.exist(err);
      done();
    });
  });

  it("should authenticate user if password is valid", function() {
    return user.authenticate('password').should.be.true;
  });

  it("should not authenticate user if password is invalid", function() {
    return user.authenticate('blah').should.not.be.true;
  });
});

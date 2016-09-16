'use strict';

var expect = require('chai').expect;

var db = require('../db').db;
var User = require('./user.model');

describe('User', function() {
    afterEach(function(done) {
        db.any('DELETE FROM member').then(() => { done(); });
    });

    describe('Creation', function() {
        it('should create user', function() {
            return User.create('test@test.com', 'test1234', 'user');
        });

        it('should reject erroneous password', function(done) {
            User.create('test@test.com', 'short', 'user').catch(err => {
                expect(err).to.equal('Password too short');
                done();
            });
        });

        it('should reject erroneous email', function(done) {
            User.create('fail', 'validpassword', 'user').catch(err => {
                expect(err).to.equal('Invalid email');
                done();
            });
        });

        it('should reject erroneous role', function(done) {
            User.create('valid@email.domain', 'validpassword', 'fool').catch(err => {
                expect(err).to.equal('Invalid role');
                done();
            });
        });

        it('should fail to create user that is missing arguments', function(done) {
            User.create().catch(err => { done(); });
        });

        it('should fail to create user with same email as other user', function(done) {
            User.create('test@test.com', 'test1234', 'user').then(data => {
                return User.create('test@test.com', 'test1234', 'user');
            }).catch(err => {
                done();
            });
        });
    });

    describe('Authentication', function() {
        it("should authenticate user if password is valid", function(done) {
            User.create('test@test.com', 'test1234', 'user').then(data => {
                expect(User.authenticate('test1234', data.hashed_password, data.salt)).to.be.true;
                done();
            });
        });

        it("should not authenticate user if password is invalid", function(done) {
            User.create('test@test.com', 'test1234', 'user').then(data => {
                expect(User.authenticate('wrong password', data.hashed_password, data.salt)).to.be.false;
                done();
            });
        });
    });
});

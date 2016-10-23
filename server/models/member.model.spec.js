'use strict';

var expect = require('chai').expect;
var moment = require('moment');

var db = require('../db').db;
var Member = require('../models/member.model');

describe('Member', function() {
    afterEach(function(done) {
        db.any('DELETE FROM member').then(() => { done(); });
    });

    describe('Creation', function() {
        it('should create member with password', function() {
            return Member.createAuthenticatable('test@test.com', 'test1234', 'user');
        });

        it('should reject erroneous password', function(done) {
            Member.createAuthenticatable('test@test.com', 'short', 'user').catch(err => {
                expect(err).to.equal('Password too short');
                done();
            });
        });

        it('should reject erroneous email', function(done) {
            Member.createAuthenticatable('fail', 'validpassword', 'user').catch(err => {
                expect(err).to.equal('Invalid email');
                done();
            });
        });

        it('should reject erroneous role', function(done) {
            Member.createAuthenticatable('valid@email.domain', 'validpassword', 'fool').catch(err => {
                expect(err).to.equal('Invalid role');
                done();
            });
        });

        it('should fail to create member that is missing arguments', function(done) {
            Member.createAuthenticatable().catch(err => { done(); });
        });

        it('should fail to create member with same email as other member', function(done) {
            Member.createAuthenticatable('test@test.com', 'test1234', 'user').then(data => {
                return Member.createCreateAuthenticatable('test@test.com', 'test1234', 'user');
            }).catch(err => {
                done();
            });
        });

        it('should create member without authenticateable attributes', function() {
            return db.one('SELECT id FROM member_type LIMIT 1').then(data => {
                let memberTypeId = data.id;

                return Member.create({
                    email: 'email@email.email',
                    name: 'Some name',
                    location: 'location',
                    education: 'education',
                    profession: 'profession',
                    memberTypeId: memberTypeId,
                    gender: 'other',
                    yearOfBirth: '1997',
                    expirationDate: moment().add(1, 'year'),
                });
            });
        });
    });

    describe('Authentication', function() {
        it("should authenticate user if password is valid", function() {
            return Member.createAuthenticatable('test@test.com', 'test1234', 'user').then(data => {
                expect(Member.authenticate('test1234', data.hashed_password, data.salt)).to.be.true;
            });
        });

        it("should not authenticate user if password is invalid", function() {
            return Member.createAuthenticatable('test@test.com', 'test1234', 'user').then(data => {
                expect(Member.authenticate('wrong password', data.hashed_password, data.salt)).to.be.false;
            });
        });
    });
});

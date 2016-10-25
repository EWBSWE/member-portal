'use strict';

var expect = require('chai').expect;
var moment = require('moment');

var db = require('../db').db;
var Member = require('../models/member.model');

describe.only('Member', function() {
    let memberTypeId;

    beforeEach(function(done) {
        db.one('SELECT id FROM member_type LIMIT 1').then(memberType => {
            memberTypeId = memberType.id;
            done();
        }).catch(err => {
            done(err);
        });
    });

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

        it('should fail to create member with missing email', function(done) {
            Member.create({}).catch(err => { done(); });
        });

        it('should fail to create member with malformed email', function(done) {
            Member.create({ email: 'invalid' }).catch(err => { done(); });
        });

        it('should null optional values missing when creating a member', function(done) {
            Member.create({ email: 'valid@email.com' }).then(() => { done(); });
        });
    });

    describe('Update', function() {
        it('should update a members attributes', function() {
            let old = {
                email: 'email@email.email',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            let updated = {
                email: 'newemail@email.email',
                name: 'New name',
                location: 'New location',
                education: 'New education',
                profession: 'New profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            return Member.create(old).then(member => {
                old.id = member.id;
                return Member.update(member.id, updated);
            }).then(member => {
                // ID shouldn't change
                expect(member.id).to.equal(old.id);

                // The rest should ideally change
                expect(member.email).to.equal(updated.email);
                expect(member.name).to.equal(updated.name);
                expect(member.location).to.equal(updated.location);
                expect(member.education).to.equal(updated.education);
                expect(member.profession).to.equal(updated.profession);
                expect(member.member_type_id).to.equal(updated.memberTypeId);
                expect(member.gender).to.equal(updated.gender);
                expect(member.year_of_birth).to.equal(updated.yearOfBirth);
                expect(moment(member.expiration_date).format()).to.equal(updated.expirationDate.format());
            });
        });

        it('should fail if trying to update to an existing email', function(done) {
            let someGuy = {
                email: 'some@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            let otherGuy = {
                email: 'other@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            Member.create(someGuy).then(member => {
                return Member.create(otherGuy);
            }).then(member => {
                return Member.update(member.id, {email: 'some@example.com'});
            }).catch(err => {
                done();
            });
        });

        it('should fail if no valid attributes to update', function(done) {
            let someGuy = {
                email: 'some@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            Member.create(someGuy).then(member => {
                return Member.update(member.id, {foo: 'bar'});
            }).catch(err => {
                done();
            });
        });
    });

    describe('Authentication', function() {
        it('should authenticate user if password is valid', function() {
            return Member.createAuthenticatable('test@test.com', 'test1234', 'user').then(data => {
                expect(Member.authenticate('test1234', data.hashed_password, data.salt)).to.be.true;
            });
        });

        it('should not authenticate user if password is invalid', function() {
            return Member.createAuthenticatable('test@test.com', 'test1234', 'user').then(data => {
                expect(Member.authenticate('wrong password', data.hashed_password, data.salt)).to.be.false;
            });
        });

        it('should reject user without password', function() {
            return Member.createAuthenticatable('test@test.com', 'test1234', 'user').then(data => {
                expect(Member.authenticate(null, null, null)).to.be.false;
            });
        });
    });

    describe('Fetching', function() {
        it('should fetch all members', function(done) {
            let someGuy = {
                email: 'some@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            let otherGuy = {
                email: 'other@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            Member.create(someGuy).then(member => {
                return Member.create(otherGuy);
            }).then(member => {
                return Member.index();
            }).then(members => {
                expect(members.length).to.equal(2);

                let emails = members.map(m => { return m.email; });

                expect(emails.includes('some@example.com')).to.be.true;
                expect(emails.includes('other@example.com')).to.be.true;

                done();
            }).catch(err => {
                done(err);
            });
        });

        it('should fetch a single member', function(done) {
            let someGuy = {
                email: 'some@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            Member.create(someGuy).then(member => {
                return Member.get(member.id);
            }).then(member => {
                expect(member.email).to.equal(someGuy.email);

                done();
            }).catch(err => {
                done(err);
            });
        });

        it('should fetch a single member even though not found', function(done) {
            let oldId;

            let someGuy = {
                email: 'some@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            Member.create(someGuy).then(member => {
                oldId = member.id;
                return Member.destroy(member.id);
            }).then(() => {
                return Member.get(oldId);
            }).then(member => {
                if (member === null) {
                    done();
                }
            }).catch(err => {
                done();
            });
        });

        it('should find member by email', function(done) {
            let someGuy = {
                email: 'some@example.com',
                name: 'Some name',
                location: 'location',
                education: 'education',
                profession: 'profession',
                memberTypeId: memberTypeId,
                gender: 'other',
                yearOfBirth: 1997,
                expirationDate: moment().add(1, 'year'),
            };

            Member.create(someGuy).then(member => {
                return Member.find(member.email);
            }).then(member => {
                expect(member.email).to.equal(someGuy.email);

                done();
            }).catch(err => {
                done(err);
            });
        });
    });
});

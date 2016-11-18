'use strict';

var expect = require('chai').expect;
var moment = require('moment');

var db = require('../db').db;
var Member = require('../models/member.model');
var MemberType = require('../models/member-type.model');
var Product = require('../models/product.model');
var ProductType = require('../models/product-type.model');

describe('Member', function() {
    let memberTypeId;

    beforeEach(function(done) {
        MemberType.create('Student').then(memberType => {
            memberTypeId = memberType.id;
            done();
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM member').then(() => {
            return db.any('DELETE FROM member_type');
        }).then(() => {
            return db.any('DELETE FROM product');
        }).then(() => {
            return db.any('DELETE FROM product_type');
        }).then(() => {
            done();
        });
    });

    describe('Create', function() {
        it('should create member with password', function(done) {
            Member.create({
                email: 'test@test.com',
                password: 'test1234',
                role: 'user'
            }).then(() => {
                done();
            });
        });

        it('should reject erroneous password', function(done) {
            Member.create({
                email: 'test@test.com',
                password: 'short',
                role: 'user'
            }).catch(err => {
                expect(err).to.equal('Invalid member');
                done();
            });
        });

        it('should reject erroneous email', function(done) {
            Member.create({
                email: 'fail',
                password: 'validpassword',
                role: 'user'
            }).catch(err => {
                expect(err).to.equal('Invalid member');
                done();
            });
        });

        it('should reject erroneous role', function(done) {
            Member.create({
                email: 'valid@email.domain',
                password: 'validpassword',
                role: 'fool'
            }).catch(err => {
                expect(err).to.equal('Invalid member');
                done();
            });
        });

        it('should fail to create member that is missing arguments', function(done) {
            Member.create().catch(err => { done(); });
        });

        it('should fail to create member with same email as other member', function(done) {
            Member.create({
                email: 'test@test.com',
                password: 'test1234',
                role: 'user'
            }).then(data => {
                return Member.create({
                    email: 'test@test.com',
                    password: 'test1234',
                    role: 'user'
                });
            }).catch(err => {
                done();
            });
        });

        it('should create member without authenticateable attributes', function(done) {
            db.one('SELECT id FROM member_type LIMIT 1').then(data => {
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
            }).then(() => {
                done();
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
        it('should update a members attributes', function(done) {
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

            Member.create(old).then(member => {
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

                done();
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

        it('should fail to update if members password is too short', function(done) {
            let someGuy = {
                email: 'some@example.com',
                role: 'user',
                password: 'validpassword',
            };

            Member.create(someGuy).then(member => {
                return Member.update(member.id, {password: 'validpassword', newPassword: 'short'});
            }).catch(err => {
                done();
            });
        });

        it('should update members password', function(done) {
            let someGuy = {
                email: 'some@example.com',
                role: 'user',
                password: 'validpassword',
            };

            Member.create(someGuy).then(member => {
                return Member.update(member.id, {password: 'validpassword', newPassword: 'alsovalidpassword'});
            }).then(() => {
                done();
            });
        });

        it('should fail to update members password', function(done) {
            let someGuy = {
                email: 'some@example.com',
                role: 'user',
                password: 'validpassword',
            };

            Member.create(someGuy).then(member => {
                return Member.update(member.id, {password: 'invalidpassword', newPassword: 'alsovalidpassword'});
            }).catch(err => {
                done();
            });
        });

        it('should extend a members membership', function(done) {
            ProductType.create(ProductType.MEMBERSHIP).then(pt => {
                return Product.create({
                    name: 'Membership 1 year',
                    price: 10,
                    attribute: {
                        days: 365,
                        member_type_id: memberTypeId,
                    },
                    productTypeId: pt.id,
                });
            }).then(p => {
                return Member.create({
                    email: 'new@example.com',
                    expirationDate: moment().add(1, 'year'),
                }).then(m => {
                    return Member.extendMembership({
                        email: 'new@example.com',
                        name: 'Some name',
                    }, p);
                });
            }).then(m => {
                let diff = moment(m.expiration_date).diff(moment(), 'days');

                expect(diff).to.equal(365 * 2 - 1);

                done();
            });
        });

        it('should create a member and extend a members membership', function(done) {
            ProductType.create(ProductType.MEMBERSHIP).then(pt => {
                return Product.create({
                    name: 'Membership 1 year',
                    price: 10,
                    attribute: {
                        days: 365,
                        member_type_id: memberTypeId,
                    },
                    productTypeId: pt.id,
                });
            }).then(p => {
                return Member.extendMembership({
                    email: 'new@example.com',
                    name: 'Some name',
                }, p);
            }).then(m => {
                let diff = moment(m.expiration_date).diff(moment(), 'days');

                expect(diff).to.equal(364);

                done();
            });
        });
    });

    describe('Authentication', function() {
        it('should authenticate user if password is valid', function(done) {
            Member.create({
                email: 'test@test.com',
                password: 'test1234',
                role: 'user'
            }).then(data => {
                return db.one(`SELECT * FROM member WHERE id = $1`, data.id);
            }).then(data => {
                expect(Member.authenticate('test1234', data.hashed_password, data.salt)).to.be.true;
                done();
            });
        });

        it('should not authenticate user if password is invalid', function(done) {
            Member.create({
                email: 'test@test.com',
                password: 'test1234',
                role: 'user'
            }).then(data => {
                expect(Member.authenticate('wrong password', data.hashed_password, data.salt)).to.be.false;
                done();
            });
        });

        it('should reject user without password', function(done) {
            Member.create({
                email: 'test@test.com',
                password: 'test1234',
                role: 'user'
            }).then(data => {
                expect(Member.authenticate(null, null, null)).to.be.false;
                done();
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
                expect(member).to.equal(null);
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
            });
        });

        it('should find member by some attributes', function(done) {
            Member.create([{
                email: 'one@example.com',
                name: 'Name',
            }, {
                email: 'two@example.com',
                name: 'Name',
            }]).then(() => {
                return Member.findBy({ email: 'one@example.com' });
            }).then(ms => {
                expect(ms.length).to.equal(1);

                return Member.findBy({name: 'Name'});
            }).then(ms => {
                expect(ms.length).to.equal(2);

                done();
            });
        });
    });

    describe('Reset password', function() {
        it('should create password reset token for user', function(done) {
            Member.create({
                email: 'any@example.com',
                role: 'user',
                password: 'validpassword',
            }).then(m => {
                return Member.createResetToken(m.id);
            }).then(m => {
                done();
            });
        });
    });
});

'use strict';

var expect = require('chai').expect;
var moment = require('moment');
var request = require('supertest');
var app = require('../../app');

var agent = request.agent(app);

var db = require('../../db').db;

var Event = require('../../models/event.model');
var Member = require('../../models/member.model');
var ProductType = require('../../models/product-type.model');

function authAdmin() {
    return auth('admin@admin.com', 'password');
}

function authUser() {
    return auth('user@user.com', 'password');
}

function authGuest() {
    return Promise.resolve(null);
}

function auth(email, password) {
    return new Promise((resolve, reject) => {
        agent.post('/auth/local')
            .send({ email: email, password: password })
            .end((err, res) => {
                if (err) {
                    return reject(err);
                }

                resolve(res.body.token);
            });
    });
}

let roles = {
    admin: {
        name: 'admin',
        auth: authAdmin,
    },
    user: {
        name: 'user',
        auth: authUser,
    },
    guest: {
        name: 'guest',
        auth: authGuest,
    },
};

describe('Event Product controller', function() {
    var ewbEvent;

    beforeEach(function(done) {
        Member.create([{
            email: 'admin@admin.com',
            password: 'password',
            role: 'admin'
        }, {
            email: 'user@user.com',
            password: 'password',
            role: 'user'
        }]).then(() => {
            return ProductType.create(ProductType.EVENT).then(() => {
                return Event.create({
                    name: 'Some event',
                    active: true,
                    notificationOpen: true,
                    identifier: 'identifier',
                    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
                    dueDate: moment().add(1, 'month'),
                    emailTemplate: {
                        sender: 'noreply@ingenjorerutangranser.se',
                        subject: 'subject',
                        body: 'body',
                    },
                    addons: [{
                        capacity: 100,
                        name: 'Free',
                        description: 'Free description',
                        price: 0,
                    }, {
                        capacity: 10,
                        name: 'Not Free',
                        description: 'Not Free description',
                        price: 100,
                    }],
                    subscribers: ['user@user.com'],
                });
            });
        }).then(e => {
            return Event.get(e.id);
        }).then(e => {
            ewbEvent = e;
            done();
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM event').then(() => {
            return db.any('DELETE FROM event_product');
        }).then(() => {
            return db.any('DELETE FROM event_subscriber');
        }).then(() => {
            return db.any('DELETE FROM event_payment');
        }).then(() => {
            return db.any('DELETE FROM event_participant');
        }).then(() => {
            return db.any('DELETE FROM product');
        }).then(() => {
            return db.any('DELETE FROM product_type');
        }).then(() => {
            return db.any('DELETE FROM member');
        }).then(() => {
            done();
        });
    });

    describe('POST /api/events/:id/addon', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 201,
            description: 'should create an addon to an event as an admin',
        }, {
            role: roles.user,
            expectCode: 201,
            description: 'should create an addon to an event as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to create an addon to an event',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.post(`/api/events/${ewbEvent.id}/addon`)
                        .query({ access_token: token })
                        .send({
                            name: 'New addon',
                            price: '10',
                            description: 'Foo',
                            capacity: '100',
                        })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('DELETE /api/events/:id/addon/:addonId', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 204,
            description: 'should delete an addon to an event as an admin',
        }, {
            role: roles.user,
            expectCode: 204,
            description: 'should delete an addon to an event as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to delete an addon to an event',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.delete(`/api/events/${ewbEvent.id}/addon/${ewbEvent.addons[0].id}`)
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('PUT /api/events/:id/addon/:addonId', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 202,
            description: 'should update an addon to an event as an admin',
        }, {
            role: roles.user,
            expectCode: 202,
            description: 'should update an addon to an event as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to update an addon to an event',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.put(`/api/events/${ewbEvent.id}/addon/${ewbEvent.addons[0].id}`)
                        .send({
                            name: 'New name',
                            price: 200,
                            capacity: 200,
                            description: 'Hey',
                        })
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });
});

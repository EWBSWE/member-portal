'use strict';

var expect = require('chai').expect;
var moment = require('moment');
var request = require('supertest');
var app = require('../../app');
var stripe = require('stripe')('***REMOVED***');

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

describe('Event controller', function() {
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

    describe('GET /api/events/public', function() {
        it('should fetch public information about event', function(done) {
            agent.get('/api/events/public')
                .query({ url: 'identifier' })
                .expect(200)
                .end((err, res) => {
                    done(err);
                });
        });

        it('should 404 if no such event', function(done) {
            agent.get('/api/events/public')
                .query({ url: 'no-such-event' })
                .expect(404)
                .end((err, res) => {
                    done(err);
                });
        });
    });

    describe('GET /api/events', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get all events as an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get all events as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get all events',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get('/api/events')
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('GET /api/events/:id', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get event as an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get event as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get event',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get(`/api/events/${ewbEvent.id}`)
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });

        cases = [{
            role: roles.admin,
            expectCode: 404,
            description: 'should get 404 for no such event as an admin',
        }, {
            role: roles.user,
            expectCode: 404,
            description: 'should get 404 for no such event as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get no such event',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                Event.destroy(ewbEvent.id).then(() => {
                    return testCase.role.auth();
                }).then(token => {
                    agent.get(`/api/events/${ewbEvent.id}`)
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('POST /api/events', function() {
        let validEvent = {
            name: 'Event',
            identifier: 'some-event',
            description: 'description',
            active: 1,
            contact: null,
            dueDate: moment().add(1, 'year').toDate(),
            emailTemplate: {
                subject: 'subject',
                body: 'body'
            },
            notificationOpen: 1,
            subscribers: ['user@user.com'],
            addons: [{
                name: 'Addon 1',
                price: 10,
                capacity: 10,
            }],
        };

        let invalidEvent = {
            name: 'Event',
            identifier: 'some-event',
            description: 'description',
            active: 1,
            contact: null,
            dueDate: moment().add(1, 'year').toDate(),
            notificationOpen: 1,
            subscribers: ['user@user.com'],
            addons: [{
                name: 'Addon 1',
                price: 10,
                capacity: 10,
            }],
        };

        let cases = [{
            role: roles.admin,
            expectCode: 201,
            description: 'should create an event as an admin',
            data: validEvent,
        }, {
            role: roles.user,
            expectCode: 201,
            description: 'should create an event as a user',
            data: validEvent,
        }, {
            role: roles.admin,
            expectCode: 400,
            description: 'should fail to create an event as an admin',
            data: invalidEvent,
        }, {
            role: roles.user,
            expectCode: 400,
            description: 'should fail to create an event as a user',
            data: invalidEvent,
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to create an event',
            data: validEvent,
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.post('/api/events')
                        .query({ access_token: token })
                        .send(testCase.data)
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('PUT /api/events/:id', function() {
        let validEvent = {
            name: 'Event 2',
        };

        let cases = [{
            role: roles.admin,
            expectCode: 202,
            description: 'should create an event as an admin',
            data: validEvent,
        }, {
            role: roles.user,
            expectCode: 202,
            description: 'should create an event as a user',
            data: validEvent,
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to create an event',
            data: validEvent,
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.put(`/api/events/${ewbEvent.id}`)
                        .query({ access_token: token })
                        .send(testCase.data)
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('DELETE /api/events/:id', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 204,
            description: 'should delete an event as an admin',
        }, {
            role: roles.user,
            expectCode: 204,
            description: 'should delete an event as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to delete an event',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.delete(`/api/events/${ewbEvent.id}`)
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('POST /api/events/:id/add-participant', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should add participant to an event as an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should add participant to an event as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to add participants',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.post(`/api/events/${ewbEvent.id}/add-participant`)
                        .query({ access_token: token })
                        .send({
                            email: 'participant@example.com',
                            addonIds: [ewbEvent.addons[0]],
                            message: 'No message',
                        })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });
});

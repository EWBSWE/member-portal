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
                });
            });
        }).then(e => {
            ewbEvent = e;
            done();
        }).catch(err => {
            console.log(err);
            done(err);
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM event').then(() => {
            return db.any('DELETE FROM event_addon');
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
        
    });

    describe('PUT /api/events/:id', function() {
        
    });

    describe('DELETE /api/events/:id', function() {
        
    });

    describe('POST /api/events/:id/add-participant', function() {
        
    });
});

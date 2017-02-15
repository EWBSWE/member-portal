'use strict';

var db = require('../../db').db;

var request = require('supertest');
var app = require('../../app');
var agent = request.agent(app);

var Member = require('../../models/member.model');
var Setting = require('../../models/setting.model');

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
}

describe('Setting controller', function() {
    beforeEach(function(done) {
        db.any(`
            INSERT INTO setting (key, value)
            VALUES ('key', 'value')`
        ).then(() => {
            return Member.create([{
                email: 'admin@admin.com',
                password: 'password',
                role: 'admin'
            }, {
                email: 'user@user.com',
                password: 'password',
                role: 'user'
            }]);
        }).then(() => {
            done();
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM setting').then(() => {
            return db.any('DELETE FROM member');
        }).then(() => {
            done();
        });
    });

    describe('GET /api/setting', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get all settings as an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get all settings as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get all settings',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get('/api/settings')
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

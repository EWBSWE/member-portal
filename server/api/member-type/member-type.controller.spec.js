'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var app = require('../../app');
var agent = request.agent(app);

var db = require('../../db').db;

var Member = require('../../models/member.model');

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

describe('Member controller', function() {
    let admin;
    let user;

    beforeEach(function(done) {
        Member.create({
            email: 'admin@admin.com',
            password: 'password',
            role: 'admin'
        }).then(member => {
            admin = member;

            return Member.create({
                email: 'user@user.com',
                password: 'password',
                role: 'user'
            });
        }).then(member => {
            user = member;
            done();
        }).catch(err => {
            console.log(err);
            done(err);
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM member').then(() => {
            done();
        });
    });

    describe('GET /api/members', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get all users for an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get all users for a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get all users',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get('/api/members')
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('GET /api/members/me', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get me admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get me user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get me',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get('/api/members/me')
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('GET /api/members/:id', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get some@example.com as admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get some@example.com as user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get some@example.com',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                Member.create({ email: 'some@example.com' }).then(member => {
                    testCase.role.auth().then(token => {
                        agent.get(`/api/members/${member.id}`)
                            .query({ access_token: token })
                            .expect(testCase.expectCode)
                            .end((err, res) => {
                                done(err);
                            });
                    });
                });
            });
        });

        cases = [{
            role: roles.admin,
            expectCode: 404,
            description: 'should get a 404 if member not found as an admin',
        }, {
            role: roles.user,
            expectCode: 404,
            description: 'should get a 404 if member not found as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get some@example.com',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                let memberId;

                Member.create({ email: 'some@example.com' }).then(member => {
                    memberId = member.id;

                    return Member.destroy(memberId);
                }).then(() => {
                    testCase.role.auth().then(token => {
                        agent.get(`/api/members/${memberId}`)
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

    describe('POST /api/members', function() {
        let data = {
            member: {
                email: 'some@example.com'
            },
            user: {
                email: 'user@example.com',
                role: 'user',
            },
            admin: {
                email: 'admin@example.com',
                role: 'admin',
            }
        };

        let cases = [{
            role: roles.admin,
            expectCode: 201,
            description: 'should create member as an admin',
            data: data.member,
        }, {
            role: roles.admin,
            expectCode: 201,
            description: 'should create user as an admin',
            data: data.user,
        }, {
            role: roles.admin,
            expectCode: 201,
            description: 'should create admin as an admin',
            data: data.admin,
        }, {
            role: roles.admin,
            expectCode: 400,
            description: 'should fail to create user as an admin',
            data: {},
        }, {
            role: roles.user,
            expectCode: 201,
            description: 'should create member as a user',
            data: data.member,
        }, {
            role: roles.user,
            expectCode: 201,
            description: 'should create user as a user',
            data: data.user,
        }, {
            role: roles.user,
            expectCode: 403,
            description: 'should deny user to create admin',
            data: data.admin,
        }, {
            role: roles.user,
            expectCode: 400,
            description: 'should fail to create user as a user',
            data: {},
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to create member',
            data: data.member,
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to create user',
            data: data.user,
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to create admin',
            data: data.admin,
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.post('/api/members')
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

    describe('POST /api/members/bulk', function() {
        let base = [
            { email: 'some@example.com' },
            { email: 'other@example.com' },
            { email: 'another@example.com', name: 'Has a name' },
            { email: 'user@user.com' },
        ];

        let cases = [{
            role: roles.admin,
            expectCode: 201,
            description: 'should bulk create users as an admin',
            additional: [],
        }, {
            role: roles.admin,
            expectCode: 201,
            description: 'should bulk create admins as an admin',
            additional: [{
                email: 'admin2@admin.com', password: 'password', role: 'admin'
            }],
        }, {
            role: roles.admin,
            expectCode: 201,
            description: 'should bulk create users as an admin',
            additional: [{
                email: 'user2@user.com', password: 'password', role: 'user'
            }],
        }, {
            role: roles.admin,
            expectCode: 201,
            description: 'should bulk create admins and users as an admin',
            additional: [{
                email: 'admin2@admin.com', password: 'password', role: 'admin'
            }, {
                email: 'user2@user.com', password: 'password', role: 'user'
            }],
        }, {
            role: roles.user,
            expectCode: 201,
            description: 'should bulk create users as a user',
            additional: [],
        }, {
            role: roles.user,
            expectCode: 201,
            description: 'shoul bulk create users as a user',
            additional: [{
                email: 'user2@user.com', password: 'password', role: 'user'
            }],
        }, {
            role: roles.user,
            expectCode: 403,
            description: 'should fail to bulk create admins as a user',
            additional: [{
                email: 'admin2@admin.com', password: 'password', role: 'admin'
            }],
        }, {
            role: roles.user,
            expectCode: 403,
            description: 'should fail to bulk create admins and users as a user',
            additional: [{
                email: 'admin2@admin.com', password: 'password', role: 'admin'
            }, {
                email: 'user2@user.com', password: 'password', role: 'user'
            }],
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to bulk create users',
            additional: [],
        }];
        
        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.post('/api/members/bulk')
                        .query({ access_token: token })
                        .send({ members: base.concat(testCase.additional) })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('POST /api/members/reset-password', function() {
        it('should respond with a bad request if missing data', function(done) {
            agent.post('/api/members/reset-password')
                .send({})
                .expect(400)
                .end((err, res) => {
                    done(err);
                });
        });

        it('should allow everyone to reset password', function(done) {
            agent.post('/api/members/reset-password')
                .send({ email: 'admin@admin.com' })
                .expect(202)
                .end((err, res) => {
                    done(err);
                });
        });

        it('should respond with OK even with nonexistant email', function(done) {
            Member.find('nonexistent@email.com').then(member => {
                if (!member) {
                    return Promise.resolve();
                }

                return Member.destroy(member.id);
            }).then(() => {
                agent.post('/api/members/reset-password')
                    .send({ email: 'nonexistent@email.com' })
                    .expect(202)
                    .end((err, res) => {
                        done(err);
                    });
            });
        });
        
    });

    describe('POST /api/members/reset-password-token', function() {
        it('should respond with a bad request if missing params', function(done) {
            agent.post('/api/members/reset-password-token')
                .send({})
                .expect(400)
                .end((err, res) => {
                    done(err);
                });
        });

        it('should respond with a bad request if missing params', function(done) {
            agent.post('/api/members/reset-password-token')
                .send({})
                .expect(400)
                .end((err, res) => {
                    done(err);
                });
        });

        it('should allow any logged in to reset their password', function(done) {
            new Promise((resolve, reject) => {
                agent.post('/api/members/reset-password')
                    .send({ email: 'user@user.com' })
                    .expect(202)
                    .end((err, res) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
            }).then(() => {
                return Member.get(user.id);
            }).then(member => {
                return new Promise((resolve, reject) => {
                    agent.post('/api/members/reset-password-token')
                        .send({ token: member.reset_token, newPassword: 'newPassword' })
                        .expect(202)
                        .end((err, res) => {
                            if (err) {
                                reject(err);
                            }
                            resolve();
                        });
                });
            }).then(() => {
                return auth('user@user.com', 'newPassword');
            }).then(token => {
                expect(token).to.exist;
                done();
            }).catch(err => {
                done(err);
            });
        });
    });

    describe('PUT /api/members/:id', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 202,
            description: 'should update user as an admin',
        }, {
            role: roles.user,
            expectCode: 202,
            description: 'should update user as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to update user',
        }];
        
        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                Member.create({
                    email: 'some@example.com',
                    name: 'Name'
                }).then(member => {
                    testCase.role.auth().then(token => {
                        agent.put(`/api/members/${member.id}`)
                            .query({ access_token: token })
                            .send({ name: 'New name' })
                            .expect(testCase.expectCode)
                            .end((err, res) => {
                                done(err);
                            });
                    });
                });
            });
        });
        
    });

    describe('DELETE /api/members/:id', function() {
        let data = {
            member: {
                email: 'some@example.com'
            },
            user: {
                email: 'user@example.com',
                role: 'user',
            },
            admin: {
                email: 'admin@example.com',
                role: 'admin',
            }
        };

        let cases = [{
            role: roles.admin,
            expectCode: 204,
            description: 'should be able to delete another admin',
            userToDelete: data.admin,
        }, {
            role: roles.admin,
            expectCode: 204,
            description: 'should be able to delete a user as an admin',
            userToDelete: data.user,
        }, {
            role: roles.admin,
            expectCode: 204,
            description: 'should be able to delete member',
            userToDelete: data.member,
        }, {
            role: roles.user,
            expectCode: 403,
            description: 'should not be able to delete an admin as a user',
            userToDelete: data.admin,
        }, {
            role: roles.user,
            expectCode: 403,
            description: 'should not be able to delete another user',
            userToDelete: data.user,
        }, {
            role: roles.user,
            expectCode: 204,
            description: 'should be able to delete member as user',
            userToDelete: data.member,
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should not be able to delete an admin as a guest',
            userToDelete: data.admin,
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should not be able to delete a user as a guest',
            userToDelete: data.user,
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should not be able to delete another member',
            userToDelete: data.member,
        }];
        
        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                Member.create(testCase.userToDelete).then(member => {
                    testCase.role.auth().then(token => {
                        agent.delete(`/api/members/${member.id}`)
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
});

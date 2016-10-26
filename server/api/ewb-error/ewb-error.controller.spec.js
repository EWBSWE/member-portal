'use strict';

var request = require('supertest');
var app = require('../../app');

var agent = request.agent(app);

var ewbError = require('../../models/ewb-error.model');
var Member = require('../../models/member.model');

describe('EWB Error controller', function() {
    describe('Authenticated admin', function() {
        var memberId;
        var token;

        before(function(done) {
            Member.create({
                email: 'admin@admin.com',
                password: 'password',
                role: 'admin'
            }).then(data => {
                memberId = data.id;

                agent.post('/auth/local')
                    .send({ email: 'admin@admin.com', password: 'password' })
                    .end((err, res) => {
                        token = res.body.token;
                        done();
                    });
            });
        });

        after(function(done) {
            Member.destroy(memberId).then(() => {
                done();
            });
        });

        describe('index', function() {
            it('should fetch index', function(done) {
                agent.get('/api/errors/')
                    .query({ access_token: token })
                    .expect(200)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        done();
                    });
            });
        });

        describe('show', function() {
            xit('should fetch some error', function() {});

            it('should fail to fetch some error', function(done) {
                var id;
                ewbError.create('message', 'origin', 'param').then(data => {
                    id = data.id;
                    return ewbError.destroy(data.id);
                }).then(() => {
                    agent.get(`/api/errors/${id}`)
                        .query({ access_token: token })
                        .expect(404)
                        .end((err, res) => {
                            if (err) {
                                return done(err);
                            }
                            done();
                        });
                });
            });

            it('should return bad request if bad request', function(done) {
                agent.get(`/api/errors/bad`)
                    .query({ access_token: token })
                    .expect(400)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        done();
                    });
            });
        });
    });

    describe('Authenticated user', function() {
        xit('should fetch some errors');
        xit('should fail to fetch some error');
        xit('should return bad request if bad request');
    });

    describe('Guest', function() {
        xit('should not be allowed to fetch errors');
        xit('should not be allowed to fetch some error');
    });
});

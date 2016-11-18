'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var app = require('../../app');
var agent = request.agent(app);

var db = require('../../db').db;

describe('Member Type controller', function() {
    beforeEach(function(done) {
        db.any(`
            INSERT INTO member_type (member_type)
            VALUES ('student'), ('working'), ('senior')
        `).then(() => {
            done();
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM member_type').then(() => {
            done();
        });
    });

    describe('GET /api/members', function() {
        it('should get all member types', function(done) {
            agent.get('/api/member-types')
                .expect(200)
                .end((err, res) => {
                    done(err);
                });
        });
    });
});

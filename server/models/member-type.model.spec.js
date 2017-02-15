'use strict';

var expect = require('chai').expect;

var db = require('../db').db;

var MemberType = require('./member-type.model');

describe('Member type model', function() {
    beforeEach(function(done) {
        done();
    });

    afterEach(function(done) {
        db.any('DELETE FROM member_type').then(() => {
            done();
        })
    });

    describe('Create', function() {
        it('should create a member type', function(done) {
            MemberType.create('test').then(mt => {
                return MemberType.index();
            }).then(mts => {
                expect(mts.length).to.equal(1);

                done();
            });
        });
    });

    describe('Read', function() {
        it('should find all member types', function(done) {
            MemberType.create('test').then(mt => {
                return MemberType.create('another');
            }).then(mt => {
                return MemberType.index();
            }).then(mts => {
                expect(mts.length).to.equal(2);

                done();
            });
        });

        it('should find a single member type from identifier', function(done) {
            MemberType.create('test').then(mt => {
                return MemberType.find('test');
            }).then(mt => {
                expect(mt.id).to.not.be.null;
                expect(mt.member_type).to.equal('test');

                done();
            });
        });
    });
});

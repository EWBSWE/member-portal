'use strict';

var expect = require('chai').expect;

var db = require('../db').db;
var ewbError = require('./ewb-error.model');

describe('Error', function() {
    afterEach(function(done) {
        db.any('DELETE FROM ewb_error').then(() => { done(); });
    });

    describe('Creation', function() {
        it('should create error with empty params', function() {
            return ewbError.create('some message', 'some origin', {});
        });

        it('should create error with string params', function() {
            return ewbError.create('some message', 'some origin', 'some params');
        });

        it('should create error with object params', function() {
            return ewbError.create('some message', 'some origin', {some: 'params'});
        });

        it('should fail when missing arguments', function(done) {
            ewbError.create().catch(err => {
                done();
            });
        });
    });

    describe('Fetching', function() {
        beforeEach(function(done) {
            ewbError.create('message', 'origin', {some: 'params'}).then(() => {
                done();
            });
        });

        it('should fetch all errors', function() {
            return ewbError.index().then(data => {
                expect(data).to.have.length.above(0);
            });
        });

        it('should fetch single error from id', function() {
            var id;
            return ewbError.create('m', 'o', 'p').then(data => {
                id = data.id;
                return ewbError.get(data.id);
            }).then(data => {
                expect(id).to.be.equal(data.id);
            });
        });
    });

    describe('Removal', function() {
        xit('should remove error');
        xit('should fail to remove missing error');
    });
});

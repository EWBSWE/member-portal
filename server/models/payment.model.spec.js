'use strict';

var db = require('../db').db;

describe('Payment model', function() {
    describe('Create', function() {
        it('should create payment');
        it('should fail to create payment when missing member');
    });

    describe('Read', function() {
        it('should find all payments');
        it('should find a single payment');
        it('should find all payments by a single user');
    });
});

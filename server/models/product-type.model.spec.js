'use strict';

var expect = require('chai').expect;

let db = require('../db').db;

let ProductType = require('./product-type.model');

describe('Product type model', function() {
    afterEach(function(done) {
        db.any('DELETE FROM product_type').then(() => {
            done();
        });
    });

    describe('Create', function() {
        it('should create a product type', function(done) {
            ProductType.create('identifier').then(pt => {
                done();
            });
        });

        it('should fail to create a product type with missing identifier', function(done) {
            ProductType.create().catch(err => {
                done();
            });
        });

        it('should fail to create a product type with unique identifier', function(done) {
            ProductType.create('identifier').then(pt => {
                return ProductType.create('identifier');
            }).catch(err => {
                done();
            });
        });
    });

    describe('Read', function() {
        it('should find product type by identifier', function(done) {
            ProductType.create('identifier').then(pt => {
                return ProductType.find('identifier');
            }).then(pt => {
                expect(pt.identifier).to.equal('identifier');

                done();
            });
        });
    });
});

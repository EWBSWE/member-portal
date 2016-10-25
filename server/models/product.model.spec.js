'use strict';

var expect = require('chai').expect;

var db = require('../db').db;

var Product = require('../models/product.model');
var ProductType = require('../models/product-type.model');

describe.only('Product model', function() {
    let productTypeId;

    beforeEach(function(done) {
        ProductType.create('Test').then(productType => {
            productTypeId = productType.id;
            done();
        }).catch(err => {
            done(err)
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM product').then(() => {
            return db.any('DELETE FROM product_type');
        }).then(() => {
            done();
        }).catch(err => {
            done(err);
        });
    });

    describe('Create', function() {
        it('should create a single product', function(done) {
            Product.create({
                productTypeId: productTypeId,
                name: 'Test',
                price: 10,
                description: 'Description',
            }).then(product => {
                expect(product.name).to.equal('Test');
                expect(product.price).to.equal('10');
                expect(product.description).to.equal('Description');
                
                done();
            });
        });

        it('should fail to create a single product that is lacking the required attributes', function(done) {
            Product.create({}).catch(err => { done(); });
        });

        it('should create an array of products', function(done) {
            Product.create([{
                productTypeId: productTypeId,
                name: 'Test 1',
                price: 10,
            }, {
                productTypeId: productTypeId,
                name: 'Test 2',
                price: 10,
            }]).then(products => {
                let names = products.map(p => { return p.name; });
                expect(names.includes('Test 1')).to.be.true;
                expect(names.includes('Test 2')).to.be.true;

                done();
            });
        });

        it('should fail to create an array of products that if one is lacking the required attributes', function(done) {
            Product.create([{}, {}]).catch(err => {
                done();
            });
        });

        it('should fail to create an array of products that if one is lacking the required attributes', function(done) {
            Product.create([{}]).catch(err => {
                done();
            });
        });

        it('should fail to create an array of products that if one is lacking the required attributes', function(done) {
            Product.create([]).catch(err => {
                done();
            });
        });
    });

    describe('Read', function() {
        it('should find product by a given id');
        it('should find all products by a given product type');
    });

    describe('Update', function() {
        it('should update a product');
        it('should reject an update where new price is less than 0');
    });

    describe('Destroy', function() {
        it('should destroy product');
        it('should fail to destroy missing product');
    });
});

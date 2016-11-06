'use strict';

var db = require('../../db').db;

var request = require('supertest');
var app = require('../../app');
var agent = request.agent(app);

var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

describe('Product controller', function() {
    beforeEach(function(done) {
        ProductType.create(ProductType.MEMBERSHIP).then(pt => {
            return Product.create({
                name: 'Name',
                price: 10,
                productTypeId: pt.id,
            });
        }).then(() => {
            done();
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM product').then(() => {
            return db.any('DELETE FROM product_type');
        }).then(() => {
            done();
        });
    });

    describe('GET /api/products/membership', function() {
        it('should get membership products', function(done) {
            agent.get('/api/products/membership')
                .query({ url: 'identifier' })
                .expect(200)
                .end((err, res) => {
                    done(err);
                });
        });
    });
});

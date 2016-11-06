'use strict';

var expect = require('chai').expect;
var moment = require('moment');

var db = require('../db').db;

var Member = require('./member.model');
var Payment = require('./payment.model');
var Product = require('./product.model');
var ProductType = require('./product-type.model');

describe('Payment model', function() {
    let product;
    let member;

    beforeEach(function(done) {
        ProductType.create(ProductType.MEMBERSHIP).then(pt => {
            return Product.create({
                name: 'Name',
                price: 10,
                description: 'Description',
                productTypeId: pt.id,
            });
        }).then(p => {
            product = p;

            return db.any(`
                INSERT INTO setting (key, value)
                VALUES
                    ('StripeTransactionFeePercent', '0.014'),
                    ('StripeTransactionFeeFlat', '1.8')
            `);
        }).then(() => {
            return Member.create({ email: 'some@example.com' });
        }).then(m => {
            member = m;

            done();
        });
    });

    afterEach(function(done) {
        db.any('DELETE FROM member').then(() => {
            return db.any('DELETE FROM payment');
        }).then(() => {
            return db.any('DELETE FROM product');
        }).then(() => {
            return db.any('DELETE FROM product_type');
        }).then(() => {
            return db.any('DELETE FROM setting');
        }).then(() => {
            done();
        });
    });

    describe('Create', function() {
        it('should create a payment', function(done) {
            Payment.create({
                member: member,
                products: [product],
            }).then(p => {
                expect(p).to.be.an('object');

                return db.any('SELECT * FROM payment_product WHERE payment_id = $1', p.id);
            }).then(pp => {
                expect(pp.length).to.equal(1);

                done();
            });
        });

        it('should create payments', function(done) {
            Payment.create([{
                member: member,
                products: [product],
            }, {
                member: member,
                products: [product],
            }]).then(ps => {
                expect(ps).to.be.an('array');
                expect(ps.length).to.equal(2);

                return db.any(`
                    SELECT payment_id, product_id
                    FROM payment_product
                    WHERE payment_id IN ($1:csv)
                `, [ps.map(p => { return p.id; })]);
            }).then(pps => {
                expect(pps.length).to.equal(2);

                done();
            });
        });

        it('should fail to create payment when missing member', function(done) {
            Payment.create({
                products: [product],
            }).catch(err => {
                done();
            });
        });

        it('should fail to create payment when missing products', function(done) {
            Payment.create({
                member: member,
            }).catch(err => {
                done();
            });
        });

        it('should fail to create payment when missing everything', function(done) {
            Payment.create({}).catch(err => {
                done();
            });
        });
    });

    describe('Read', function() {
        it('should find all payments', function(done) {
            Payment.create([{
                member: member,
                products: [product],
            }, {
                member: member,
                products: [product],
            }]).then(ps => {
                return Payment.index();
            }).then(ps => {
                expect(ps.length).to.equal(2);

                done();
            });
        });

        it('should find a single payment', function(done) {
            Payment.create({
                member: member,
                products: [product],
            }).then(p => {
                return Payment.get(p.id);
            }).then(p => {
                expect(p.amount).to.equal(+product.price);
                expect(p.member_id).to.equal(member.id);

                done();
            });
        });

        it('should find all payments by a single user', function(done) {
            Payment.create({
                member: member,
                products: [product],
            }).then(p => {
                return Payment.findBy({ memberId: member.id });
            }).then(ps => {
                expect(ps.length).to.equal(1);

                done();
            });
        });

        it('should generate a report', function(done) {
            Payment.create([{
                member: member,
                products: [product],
            }, {
                member: member,
                products: [product],
            }, {
                member: member,
                products: [product],
            }, {
                member: member,
                products: [product],
            }]).then(ps => {
                let start = moment().subtract(1, 'month').toDate();
                let end = moment().add(1, 'month').toDate();

                return Payment.generateReport(start, end);
            }).then(report => {
                done();
            });
        });
    });
});

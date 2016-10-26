'use strict';

var expect = require('chai').expect;
var moment = require('moment');
var request = require('supertest');
var app = require('../../app');
var stripe = require('stripe')('***REMOVED***');

var agent = request.agent(app);

var db = require('../../db').db;

var EmailTemplate = require('../../models/email-template.model');
var Event = require('../../models/event.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var Payment = require('../../models/payment.model');
var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

describe('Payment controller', function() {
    var productId;
    var memberId;
    var token;

    beforeEach(function(done) {
        ProductType.create(ProductType.MEMBERSHIP).then(productType => {
            return Product.create({
                name: 'Foo',
                price: 100,
                description: 'This is a description',
                productTypeId: productType.id,
                attribute: {
                    durationDays: 365,
                    memberType: 'student',
                }
            });
        }).then(product => {
            productId = product.id;
        }).then(() => {
            Member.create({
                email: 'admin@admin.com',
                password: 'password',
                role: 'admin'
            }).then(data => {
                memberId = data.id;
                done();
            });
        }).catch(err => {
            console.log(err);
            done(err);
        });
    });

    afterEach(function(done) {
        db.none(`DELETE FROM member`).then(() => {
            return db.none(`DELETE FROM product`)
        }).then(() => {
            return db.none(`DELETE FROM product_type`);
        }).then(() => {
            return db.none(`DELETE FROM outgoing_message`);
        }).then(() => {
            return db.none(`DELETE FROM ewb_error`);
        }).then(() => {
            done();
        });
    });

    describe('Fetching payments', function() {
        it('should fetch all payments as admin');
        it('should fetch all payments as user');
        it('should fail to fetch all payments as unauthenticated');
    });

    describe('Become a member', function() {
        it('should create a Stripe token', function(done) {
            stripe.tokens.create({
                card: {
                    number: '4242424242424242',
                    exp_month: 12,
                    exp_year: moment().add(1, 'year').format('YYYY'),
                    cvc: 666,
                }
            }, function(err, token) {
                if (err) {
                    return done(err);
                }

                expect(token).to.exist;

                done();
            });
        });

        it('should confirm membership payment and create new member', function(done) {
            var member;

            this.timeout(4000);

            new Promise((resolve, reject) => {
                stripe.tokens.create({
                    card: {
                        number: '4242424242424242',
                        exp_month: 12,
                        exp_year: moment().add(1, 'year').format('YYYY'),
                        cvc: 666,
                    }
                }, function(err, token) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(token);
                });
            }).then(stripeToken => {
                return new Promise((resolve, reject) => {
                    agent.post('/api/payments/confirm')
                        .send({
                            stripeToken: stripeToken,
                            productId: productId,
                            name: 'Some name',
                            location: 'Some location',
                            profession: 'Some profession',
                            education: 'Some education',
                            email: 'ict@ingenjorerutangranser.se',
                            gender: 'other',
                            yearOfBirth: '1900',
                        })
                        .expect(201)
                        .end((err, res) => {
                            if (err) {
                                return reject(err);
                            }

                            resolve();
                        });
                });
            }).then(() => {
                return Member.find('ict@ingenjorerutangranser.se');
            }).then(maybeMember => {
                expect(maybeMember).to.exist;
                member = maybeMember;
            }).then(() => {
                return OutgoingMessage.find(member.email);
            }).then(messages => {
                expect(messages.length).to.eql(2);
                return Payment.find(member.id);
            }).then(payments => {
                expect(payments.length).to.eql(1);
                done();
            }).catch(err => {
                console.log(err);
                done(err);
            });
        });

        it('should update existing member', function(done) {
            var expirationDate = moment().add(1, 'year');

            this.timeout(4000);

            Member.create({
                email: 'ict@ingenjorerutangranser.se',
                name: 'Some name',
                location: 'Some location',
                profession: 'Some profession',
                education: 'Some education',
                gender: 'other',
                yearOfBirth: '1900',
                memberTypeId: 1,
                expirationDate: expirationDate,
            }).then(() => { 
                return new Promise((resolve, reject) => {
                    stripe.tokens.create({
                        card: {
                            number: '4242424242424242',
                            exp_month: 12,
                            exp_year: moment().add(1, 'year').format('YYYY'),
                            cvc: 666,
                        }
                    }, function(err, token) {
                        if (err) {
                            return reject(err);
                        }

                        resolve(token);
                    });
                });
            }).then(stripeToken => {
                return new Promise((resolve, reject) => {
                    agent.post('/api/payments/confirm')
                        .send({
                            stripeToken: stripeToken,
                            productId: productId,
                            name: 'New name',
                            location: 'New location',
                            profession: 'New profession',
                            education: 'New education',
                            email: 'ict@ingenjorerutangranser.se',
                            gender: 'other',
                            yearOfBirth: '1900',
                        })
                        .expect(201)
                        .end((err, res) => {
                            if (err) {
                                return reject(err);
                            }

                            resolve();
                        });
                });
            }).then(() => {
                done();
            }).catch(err => {
                done(err);
            });
        });

        it('should reject new member with erroneous payment', function() {
            this.timeout(4000);

            return new Promise((resolve, reject) => {
                stripe.tokens.create({
                    card: {
                        number: '4000000000000002',
                        exp_month: 12,
                        exp_year: moment().add(1, 'year').format('YYYY'),
                        cvc: 666,
                    }
                }, function(err, token) {
                    if (err) {
                        reject(err);
                    }
                    resolve(token);
                });
            }).then(stripeToken => {
                agent.post('/api/payments/confirm')
                    .send({
                        stripeToken: stripeToken,
                        productId: productId,
                        name: 'Some name',
                        location: 'Some location',
                        profession: 'Some profession',
                        education: 'Some education',
                        email: 'ict@ingenjorerutangranser.se',
                        gender: 'other',
                        yearOfBirth: '1900',
                    })
                    .expect(400)
                    .end((err, res) => {
                        if (err) {
                            return Promise.reject(err);
                        }

                        return Promise.resolve();
                    });
            });
        });

        it('should reject exisiting member with erroneous payment', function() {
            this.timeout(4000);

            Member.create({
                email: 'ict@ingenjorerutangranser.se',
                name: 'Some name',
                location: 'Some location',
                profession: 'Some profession',
                education: 'Some education',
                gender: 'other',
                yearOfBirth: '1900',
                memberTypeId: 1,
                expirationDate: moment().add(1, 'year')
            }).then(() => { 
                return new Promise((resolve, reject) => {
                    stripe.tokens.create({
                        card: {
                            number: '4000000000000002',
                            exp_month: 12,
                            exp_year: moment().add(1, 'year').format('YYYY'),
                            cvc: 666,
                        }
                    }, function(err, token) {
                        if (err) {
                            return reject(err);
                        }

                        resolve(token);
                    });
                });
            }).then(stripeToken => {
                return new Promise((resolve, reject) => {
                    agent.post('/api/payments/confirm')
                        .send({
                            stripeToken: stripeToken,
                            productId: productId,
                            name: 'New name',
                            location: 'New location',
                            profession: 'New profession',
                            education: 'New education',
                            email: 'ict@ingenjorerutangranser.se',
                            gender: 'other',
                            yearOfBirth: '1900',
                        })
                        .expect(400)
                        .end((err, res) => {
                            if (err) {
                                return reject(err);
                            }

                            resolve();
                        });
                });
            });
        });
    });

    describe('Event participation', function() {
        var event;

        beforeEach(function(done) {
            ProductType.create(ProductType.EVENT).then(() => {
                return Event.create({
                    name: 'Some event',
                    active: true,
                    notificationOpen: true,
                    identifier: 'identifier',
                    dueDate: moment().add(1, 'month'),
                    emailTemplate: {
                        sender: 'noreply@ingenjorerutangranser.se',
                        subject: 'subject',
                        body: 'body',
                    },
                    addons: [{
                        capacity: 100,
                        name: 'Free',
                        description: 'Free description',
                        price: 0,
                    }, {
                        capacity: 10,
                        name: 'Not Free',
                        description: 'Not Free description',
                        price: 100,
                    }]
                });
            }).then(e => {
                return Event.find(e.identifier);
            }).then(e => {
                event = e;
                done();
            }).catch(err => {
                console.log(err);
                done(err);
            });
        });

        afterEach(function(done) {
            db.none(`DELETE FROM event`).then(() => {
                return db.none(`DELETE FROM event_addon`)
            }).then(() => {
                return db.none(`DELETE FROM event_participant`)
            }).then(() => {
                return db.none(`DELETE FROM event_payment`);
            }).then(() => {
                done();
            }).catch(err => {
                console.log(err);
                done(err);
            });
        });

        it('should sign up for event with no fee', function(done) {
            agent.post('/api/payments/confirm-event')
                .send({
                    stripeToken: null,
                    participant: {
                        name: 'Some name',
                        email: 'ict@ingenjorerutangranser.se',
                    },
                    identifier: event.identifier,
                    addonIds: [event.addons[0]]
                })
                .expect(201)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    done();
                });
        });

        it('should sign up for event with fee', function(done) {
            this.timeout(4000);

            new Promise((resolve, reject) => {
                stripe.tokens.create({
                    card: {
                        number: '4242424242424242',
                        exp_month: 12,
                        exp_year: moment().add(1, 'year').format('YYYY'),
                        cvc: 666,
                    }
                }, function(err, token) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(token);
                });
            }).then(token => {
                agent.post('/api/payments/confirm-event')
                    .send({
                        stripeToken: token,
                        participant: {
                            name: 'Some name',
                            email: 'ict@ingenjorerutangranser.se',
                        },
                        identifier: event.identifier,
                        addonIds: [event.addons[1]]
                    })
                    .expect(201)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }

                        done();
                    });
            }).catch(err => {
                console.log(err);
                done(err);
            });
        });

        it('should sign up for event with both free and not free addon', function(done) {
            this.timeout(4000);

            new Promise((resolve, reject) => {
                stripe.tokens.create({
                    card: {
                        number: '4242424242424242',
                        exp_month: 12,
                        exp_year: moment().add(1, 'year').format('YYYY'),
                        cvc: 666,
                    }
                }, function(err, token) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(token);
                });
            }).then(token => {
                agent.post('/api/payments/confirm-event')
                    .send({
                        stripeToken: token,
                        participant: {
                            name: 'Some name',
                            email: 'ict@ingenjorerutangranser.se',
                        },
                        identifier: event.identifier,
                        addonIds: [event.addons[1]],
                    })
                    .expect(201)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }

                        done();
                    });
            }).catch(err => {
                console.log(err);
                done(err);
            });
            
        });

        it('should reject participants when payment fails', function(done) {
            this.timeout(4000);

            new Promise((resolve, reject) => {
                stripe.tokens.create({
                    card: {
                        number: '4000000000000002',
                        exp_month: 12,
                        exp_year: moment().add(1, 'year').format('YYYY'),
                        cvc: 666,
                    }
                }, function(err, token) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(token);
                });
            }).then(token => {
                agent.post('/api/payments/confirm-event')
                    .send({
                        stripeToken: token,
                        participant: {
                            name: 'Some name',
                            email: 'ict@ingenjorerutangranser.se',
                        },
                        identifier: event.identifier,
                        addonIds: [event.addons[1]],
                    })
                    .expect(400)
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }

                        done();
                    });
            }).catch(err => {
                console.log(err);
                done(err);
            });
        });
    });
});

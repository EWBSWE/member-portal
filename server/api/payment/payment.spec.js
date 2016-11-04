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
var MemberType = require('../../models/member-type.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var Payment = require('../../models/payment.model');
var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

function authAdmin() {
    return auth('admin@admin.com', 'password');
}

function authUser() {
    return auth('user@user.com', 'password');
}

function authGuest() {
    return Promise.resolve(null);
}

function auth(email, password) {
    return new Promise((resolve, reject) => {
        agent.post('/auth/local')
            .send({ email: email, password: password })
            .end((err, res) => {
                if (err) {
                    return reject(err);
                }

                resolve(res.body.token);
            });
    });
}

let roles = {
    admin: {
        name: 'admin',
        auth: authAdmin,
    },
    user: {
        name: 'user',
        auth: authUser,
    },
    guest: {
        name: 'guest',
        auth: authGuest,
    },
};

describe('Payment controller', function() {
    var productId;
    var product;
    var memberId;
    var token;
    var memberTypeId;

    beforeEach(function(done) {
        MemberType.create('test').then(memberType => {
            memberTypeId = memberType.id;

            return ProductType.create(ProductType.MEMBERSHIP).then(productType => {
                return Product.create({
                    name: 'Foo',
                    price: 100,
                    description: 'This is a description',
                    productTypeId: productType.id,
                    attribute: {
                        days: 365,
                        member_type_id: memberType.id
                    }
                });
            });
        }).then(p => {
            product = p;
            productId = p.id;
        }).then(() => {
            return Member.create([{
                email: 'admin@admin.com',
                password: 'password',
                role: 'admin'
            }, {
                email: 'user@user.com',
                password: 'password',
                role: 'user'
            }]);
        }).then(members => {
            memberId = members[0].id;

            return Payment.create({
                member: members[0],
                products: [product],
            });
        }).then(() => {
            done();
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
            return db.none(`DELETE FROM member_type`);
        }).then(() => {
            return db.none(`DELETE FROM payment`);
        }).then(() => {
            done();
        });
    });


    describe('GET /api/payments', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get all payments as an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get all payments as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get all payments',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get('/api/payments')
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('GET /api/payments/:id', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get single payment as an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get single paymentsas a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get single payment',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get('/api/payments')
                        .query({ access_token: token })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });

    describe('POST /api/payments/confirm', function() {
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
                return Payment.findBy({ memberId: member.id });
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
                memberTypeId: memberTypeId,
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
                memberTypeId: memberTypeId,
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

    describe('POST /api/payments/confirm-event', function() {
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

    describe('GET /api/payments/stripe-checkout', function() {
        it('should return a Stripe checkout key', function(done) {
            agent.get('/api/payments/stripe-checkout')
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    done();
                });
        });
    });

    describe('GET /api/payments/report', function() {
        let cases = [{
            role: roles.admin,
            expectCode: 200,
            description: 'should get report as an admin',
        }, {
            role: roles.user,
            expectCode: 200,
            description: 'should get report as a user',
        }, {
            role: roles.guest,
            expectCode: 401,
            description: 'should deny guest to get report',
        }];

        cases.forEach(function(testCase) {
            it(testCase.description, function(done) {
                testCase.role.auth().then(token => {
                    agent.get('/api/payments/report')
                        .query({
                            access_token: token,
                            start: moment().subtract(2, 'months').format('YYYY-MM-DD'),
                            end: moment().add(1, 'month').format('YYYY-MM-DD'),
                            recipient: 'ict@ingenjorerutangranser.se',
                        })
                        .expect(testCase.expectCode)
                        .end((err, res) => {
                            done(err);
                        });
                });
            });
        });
    });
});

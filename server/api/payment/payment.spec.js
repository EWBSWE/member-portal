'use strict';



//var should = require('should');

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

describe('Payment controller', function() {
    var productId;
    var memberId;
    var token;

    beforeEach(function(done) {
        Product.createProductType('Member').then(productType => {
            return Product.create({
                name: 'Foo',
                price: 100,
                description: 'This is a description',
                productType: productType.productType,
                attribute: {
                    durationDays: 365,
                    memberType: 'student',
                }
            });
        }).then(() => {
            Member.createAuthenticatable('admin@admin.com', 'password', 'admin').then(data => {
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

    xdescribe('Fetching payments', function() {
        it('should fetch all payments as admin');
        it('should fetch all payments as user');
        it('should fail to fetch all payments as unauthenticated');
    });

    xdescribe('Become a member', function() {
        var accessToken;

        beforeEach(function(done) {
            agent.post('/auth/local')
                .send({ email: 'admin@admin.com', password: 'password' })
                .end((err, res) => {
                    token = res.body.token;
                    done();
                });
        });

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
                return Member.find('ict@ingenjorerutangranser.se');
            }).then(member => {
                expect(member).to.exist;
                expect(member.name).to.eql('New name');
                expect(moment(member.expiration_date).diff(moment(expirationDate), 'days')).to.be.above(364);
                done();
            }).catch(err => {
                done(err);
            });
        });

        it('should reject new member with erroneous payment', function(done) {
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
                            return done(err);
                        }

                        done();
                    });
            });
        });

        it('should reject exisiting member with erroneous payment', function() {
            this.timeout(400);

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
            Product.createProductType('Event').then(() => {
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
                    addonIds: event.addon_ids
                })
                .expect(201)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }

                    done();
                });
        });

        it('should sign up for event with fee');

        it('should sign up for event with no fee with free addon');

        it('should sign up for event with no fee with addon');

        it('should reject participants when payment fails');
    });

});




//var Event = require('../../models/event.model');
//var EventAddon = require('../../models/event-addon.model');
//var EventParticipant = require('../../models/event-participant.model');
//var Member = require('../../models/member.model');
//
//var PaymentHelper = require('../payment/payment.helper');
//var ewbMail = require('../../components/ewb-mail');

//describe('CONFIRM Event payment process', function() {

    //describe('Sign up for event with no cost', function() {
        //var ewbEvent;

        //before(function(done) {
            //removeEvent(function() {
                //ProductType.create({ identifier: 'Event' }, function(err, pt) {
                    //if (err) {
                        //return done(err);
                    //}

                    //Event.create({
                        //name: 'Test Event',
                        //identifier: 'test-event',
                        //description: 'Test description',
                        //active: true,
                        //dueDate: moment().add(1, 'month'),
                        //contact: 'ict@ingenjorerutangranser.se',
                        //confirmationEmail: {
                            //subject: 'Test event subject',
                            //body: 'Test event body',
                        //},
                    //}, function(err, ev) {
                        //if (err) {
                            //return done(err);
                        //}

                        //Product.create({
                            //name: 'Test product',
                            //price: 0,
                            //description: 'Test description',
                            //type: pt._id,
                        //}, function(err, p) {
                            //if (err) {
                                //return done(err);
                            //}

                            //EventAddon.create({
                                //capacity: 1,
                                //product: p._id,
                            //}, function(err, addon) {
                                //if (err) {
                                    //return done(err);
                                //}

                                //ev.addons.push(addon);
                                //ev.save(function(err, updatedEvent) {
                                    //if (err) {
                                        //return done(err);
                                    //}

                                    //Event.findById(ev._id).populate({
                                        //path: 'addons',
                                        //populate: {
                                            //path: 'product'
                                        //},
                                    //}).exec(function(err, e) {
                                        //if (err) {
                                            //return done(err);
                                        //}

                                        //ewbEvent = e;

                                        //done();
                                    //});
                                //});
                            //});
                        //});
                    //});
                //});
            //});
        //});

        //it('should confirm participant', function(done) {
            //agent.post('/api/payments/confirm-event').send({
                //stripeToken: null,
                //participant: {
                    //name: 'Some guy',
                    //email: 'dan.johansson@ingenjorerutangranser.se',
                //},
                //identifier: ewbEvent.identifier,
                //addonIds: _.map(ewbEvent.addons, '_id'),
            //}).expect(200).end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});

        //it('number of participants should have increased by 1', function(done) {
            //Event.findById(ewbEvent._id, function(err, someEvent) {
                //if (err) {
                    //return done(err);
                //}

                //if (someEvent.participants.length <= ewbEvent.participants.length) {
                    //return done(new Error('Participant not added'));
                //}

                //done();
            //});
        //});

        //it('and spots left should have decreased by 1', function(done) {
            //EventAddon.findById(ewbEvent.addons[0]._id, function(err, addon) {
                //if (err) {
                    //return done(err);
                //}

                //if (addon.capacity >= ewbEvent.addons[0].capacity) {
                    //return done(new Error('Capacity not decreased'));
                //}

                //done();
            //});
        //});

        //it('there should be a confirmation email', function(done) {
            //OutgoingMessage.findOne({
                //to: 'dan.johansson@ingenjorerutangranser.se',
                //subject: ewbEvent.confirmationEmail.subject,
                //text: ewbEvent.confirmationEmail.body,
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //if (!m) {
                    //return done(new Error('Missing confirmation email'));
                //}

                //done();
            //});
        //});

        //after(function(done) {
            //removeEvent(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});
    //});

    //describe('Sign up for event with cost', function() {
        //var ewbEvent;
        //var stripeToken;

        //before(function(done) {
            //removeEvent(function() {
                //ProductType.create({ identifier: 'Event' }, function(err, pt) {
                    //if (err) {
                        //return done(err);
                    //}

                    //Event.create({
                        //name: 'Test Event',
                        //identifier: 'test-event',
                        //description: 'Test description',
                        //active: true,
                        //dueDate: moment().add(1, 'month'),
                        //contact: 'ict@ingenjorerutangranser.se',
                        //confirmationEmail: {
                            //subject: 'Test event subject',
                            //body: 'Test event body',
                        //},
                    //}, function(err, ev) {
                        //if (err) {
                            //return done(err);
                        //}

                        //Product.create({
                            //name: 'Test product',
                            //price: 100,
                            //description: 'Test description',
                            //type: pt._id,
                        //}, function(err, p) {
                            //if (err) {
                                //return done(err);
                            //}

                            //EventAddon.create({
                                //capacity: 1,
                                //product: p._id,
                            //}, function(err, addon) {
                                //if (err) {
                                    //return done(err);
                                //}

                                //ev.addons.push(addon);
                                //ev.save(function(err, updatedEvent) {
                                    //if (err) {
                                        //return done(err);
                                    //}

                                    //Event.findById(ev._id).populate({
                                        //path: 'addons',
                                        //populate: {
                                            //path: 'product'
                                        //},
                                    //}).exec(function(err, e) {
                                        //if (err) {
                                            //return done(err);
                                        //}

                                        //ewbEvent = e;

                                        //done();
                                    //});
                                //});
                            //});
                        //});
                    //});
                //});
            //});
        //});

        //it('should create a Stripe token', function(done) {
            //stripe.tokens.create({
                //card: {
                    //number: '4242424242424242',
                    //exp_month: 12,
                    //exp_year: moment().add(1, 'year').format('YYYY'),
                    //cvc: 666,
                //}
            //}, function(err, token) {
                //if (err) {
                    //return done(err);
                //}
                //stripeToken = token;
                //done();
            //});
        //});

        //it('should confirm payment', function(done) {
            //agent.post('/api/payments/confirm-event').send({
                //stripeToken: stripeToken,
                //participant: {
                    //name: 'Some guy',
                    //email: 'dan.johansson@ingenjorerutangranser.se',
                //},
                //identifier: ewbEvent.identifier,
                //addonIds: _.map(ewbEvent.addons, '_id'),
            //}).expect(200).end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});

        //it('number of participants should have increased by 1', function(done) {
            //Event.findById(ewbEvent._id, function(err, someEvent) {
                //if (err) {
                    //return done(err);
                //}

                //if (someEvent.participants.length <= ewbEvent.participants.length) {
                    //return done(new Error('Participant not added'));
                //}

                //done();
            //});
        //});

        //it('and spots left should have decreased by 1', function(done) {
            //EventAddon.findById(ewbEvent.addons[0]._id, function(err, addon) {
                //if (err) {
                    //return done(err);
                //}

                //if (addon.capacity >= ewbEvent.addons[0].capacity) {
                    //return done(new Error('Capacity not decreased'));
                //}

                //done();
            //});
        //});

        //it('there should be a confirmation email', function(done) {
            //OutgoingMessage.findOne({
                //to: 'dan.johansson@ingenjorerutangranser.se',
                //subject: ewbEvent.confirmationEmail.subject,
                //text: ewbEvent.confirmationEmail.body,
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //if (!m) {
                    //return done(new Error('Missing confirmation email'));
                //}

                //done();
            //});
        //});
        
        //after(function(done) {
            //removeEvent(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});
    //});

    //describe('Sign up for event with no cost with free addon', function() {
        //var ewbEvent;

        //before(function(done) {
            //removeEvent(function() {
                //ProductType.create({ identifier: 'Event' }, function(err, pt) {
                    //if (err) {
                        //return done(err);
                    //}

                    //Event.create({
                        //name: 'Test Event',
                        //identifier: 'test-event',
                        //description: 'Test description',
                        //active: true,
                        //dueDate: moment().add(1, 'month'),
                        //contact: 'ict@ingenjorerutangranser.se',
                        //confirmationEmail: {
                            //subject: 'Test event subject',
                            //body: 'Test event body',
                        //},
                    //}, function(err, ev) {
                        //if (err) {
                            //return done(err);
                        //}

                        //Product.create([{
                            //name: 'Test product',
                            //price: 0,
                            //description: 'Test description',
                            //type: pt._id,
                        //}, {
                            //name: 'Test product also',
                            //price: 0,
                            //description: 'Test description',
                            //type: pt._id,
                        //}], function(err, ps) {
                            //if (err) {
                                //return done(err);
                            //}

                            //EventAddon.create([{
                                //capacity: 1,
                                //product: ps[0]._id,
                            //}, {
                                //capacity: 1,
                                //product: ps[1]._id,
                            //}], function(err, addons) {
                                //if (err) {
                                    //return done(err);
                                //}

                                //ev.addons.push(addons[0]);
                                //ev.addons.push(addons[1]);
                                //ev.save(function(err, updatedEvent) {
                                    //if (err) {
                                        //return done(err);
                                    //}

                                    //Event.findById(ev._id).populate({
                                        //path: 'addons',
                                        //populate: {
                                            //path: 'product'
                                        //},
                                    //}).exec(function(err, e) {
                                        //if (err) {
                                            //return done(err);
                                        //}

                                        //ewbEvent = e;

                                        //done();
                                    //});
                                //});
                            //});
                        //});
                    //});
                //});
            //});
        //});

        //it('should confirm participant', function(done) {
            //agent.post('/api/payments/confirm-event').send({
                //stripeToken: null,
                //participant: {
                    //name: 'Some guy',
                    //email: 'dan.johansson@ingenjorerutangranser.se',
                //},
                //identifier: ewbEvent.identifier,
                //addonIds: _.map(ewbEvent.addons, '_id'),
            //}).expect(200).end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});

        //it('number of participants should have increased by 1', function(done) {
            //Event.findById(ewbEvent._id, function(err, someEvent) {
                //if (err) {
                    //return done(err);
                //}

                //if (someEvent.participants.length <= ewbEvent.participants.length) {
                    //return done(new Error('Participant not added'));
                //}

                //done();
            //});
        //});

        //it('and spots left should have decreased by 1', function(done) {
            //EventAddon.findById(ewbEvent.addons[0]._id, function(err, addon) {
                //if (err) {
                    //return done(err);
                //}

                //if (addon.capacity >= ewbEvent.addons[0].capacity) {
                    //return done(new Error('Capacity not decreased'));
                //}

                //done();
            //});
        //});

        //it('there should be a confirmation email', function(done) {
            //OutgoingMessage.findOne({
                //to: 'dan.johansson@ingenjorerutangranser.se',
                //subject: ewbEvent.confirmationEmail.subject,
                //text: ewbEvent.confirmationEmail.body,
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //if (!m) {
                    //return done(new Error('Missing confirmation email'));
                //}

                //done();
            //});
        //});
        
        //after(function(done) {
            //removeEvent(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});
    //});

    //describe('Sign up for event with no cost with addon', function() {
        //var ewbEvent;
        //var stripeToken;

        //before(function(done) {
            //removeEvent(function() {
                //ProductType.create({ identifier: 'Event' }, function(err, pt) {
                    //if (err) {
                        //return done(err);
                    //}

                    //Event.create({
                        //name: 'Test Event',
                        //identifier: 'test-event',
                        //description: 'Test description',
                        //active: true,
                        //dueDate: moment().add(1, 'month'),
                        //contact: 'ict@ingenjorerutangranser.se',
                        //confirmationEmail: {
                            //subject: 'Test event subject',
                            //body: 'Test event body',
                        //},
                    //}, function(err, ev) {
                        //if (err) {
                            //return done(err);
                        //}

                        //Product.create([{
                            //name: 'Test product',
                            //price: 0,
                            //description: 'Test description',
                            //type: pt._id,
                        //}, {
                            //name: 'Test product also',
                            //price: 100,
                            //description: 'Test description',
                            //type: pt._id,
                        //}], function(err, ps) {
                            //if (err) {
                                //return done(err);
                            //}

                            //EventAddon.create([{
                                //capacity: 1,
                                //product: ps[0]._id,
                            //}, {
                                //capacity: 1,
                                //product: ps[1]._id,
                            //}], function(err, addons) {
                                //if (err) {
                                    //return done(err);
                                //}

                                //ev.addons.push(addons[0]);
                                //ev.addons.push(addons[1]);
                                //ev.save(function(err, updatedEvent) {
                                    //if (err) {
                                        //return done(err);
                                    //}

                                    //Event.findById(ev._id).populate({
                                        //path: 'addons',
                                        //populate: {
                                            //path: 'product'
                                        //},
                                    //}).exec(function(err, e) {
                                        //if (err) {
                                            //return done(err);
                                        //}

                                        //ewbEvent = e;

                                        //done();
                                    //});
                                //});
                            //});
                        //});
                    //});
                //});
            //});
        //});

        //it('should create a Stripe token', function(done) {
            //stripe.tokens.create({
                //card: {
                    //number: '4242424242424242',
                    //exp_month: 12,
                    //exp_year: moment().add(1, 'year').format('YYYY'),
                    //cvc: 666,
                //}
            //}, function(err, token) {
                //if (err) {
                    //return done(err);
                //}
                //stripeToken = token;
                //done();
            //});
        //});

        //it('should confirm payment', function(done) {
            //agent.post('/api/payments/confirm-event').send({
                //stripeToken: stripeToken,
                //participant: {
                    //name: 'Some guy',
                    //email: 'dan.johansson@ingenjorerutangranser.se',
                //},
                //identifier: ewbEvent.identifier,
                //addonIds: _.map(ewbEvent.addons, '_id'),
            //}).expect(200).end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});

        //it('number of participants should have increased by 1', function(done) {
            //Event.findById(ewbEvent._id, function(err, someEvent) {
                //if (err) {
                    //return done(err);
                //}

                //if (someEvent.participants.length <= ewbEvent.participants.length) {
                    //return done(new Error('Participant not added'));
                //}

                //done();
            //});
        //});

        //it('and spots left should have decreased by 1', function(done) {
            //EventAddon.findById(ewbEvent.addons[0]._id, function(err, addon) {
                //if (err) {
                    //return done(err);
                //}

                //if (addon.capacity >= ewbEvent.addons[0].capacity) {
                    //return done(new Error('Capacity not decreased'));
                //}

                //done();
            //});
        //});

        //it('should be exist a receipt email', function(done) {
            //OutgoingMessage.findOne({
                //to: 'dan.johansson@ingenjorerutangranser.se',
                //subject: ewbMail.getSubject('receipt', { name: ewbEvent.confirmationEmail.subject }),
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //Event.findById(ewbEvent._id).populate({
                    //path: 'payments',
                    //populate: {
                        //path: 'products',
                        //model: 'Product',
                    //},
                //}).exec(function(err, someEvent) {
                    //if (err) {
                        //return done(err);
                    //}

                    //if (!m) {
                        //return done(new Error('Missing receipt email'));
                    //}

                    //var payment = someEvent.payments[0];

                    //var listIsOkay = m.text.indexOf(PaymentHelper.formatProductList(payment.products)) > -1;
                    //if (!listIsOkay) {
                        //return done(new Error('Product list is wrong'));
                    //}

                    //var totalIsOkay = m.text.indexOf(PaymentHelper.formatTotal(payment.products)) > -1;
                    //if (!totalIsOkay) {
                        //return done(new Error('Total is wrong'));
                    //}

                    //done();
                //});
            //});
        //});

        //it('there should be a confirmation email', function(done) {
            //OutgoingMessage.findOne({
                //to: 'dan.johansson@ingenjorerutangranser.se',
                //subject: ewbEvent.confirmationEmail.subject,
                //text: ewbEvent.confirmationEmail.body,
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //if (!m) {
                    //return done(new Error('Missing confirmation email'));
                //}

                //done();
            //});
        //});
        
        //after(function(done) {
            //removeEvent(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});
    //});

    //describe('Sign up for event with addon - Stripe reject', function() {
        //var ewbEvent;
        //var stripeToken;
        
        //before(function(done) {
            //removeEvent(function() {
                //ProductType.create({ identifier: 'Event' }, function(err, pt) {
                    //if (err) {
                        //return done(err);
                    //}

                    //Event.create({
                        //name: 'Test Event',
                        //identifier: 'test-event',
                        //description: 'Test description',
                        //active: true,
                        //dueDate: moment().add(1, 'month'),
                        //contact: 'ict@ingenjorerutangranser.se',
                        //confirmationEmail: {
                            //subject: 'Test event subject',
                            //body: 'Test event body',
                        //},
                    //}, function(err, ev) {
                        //if (err) {
                            //return done(err);
                        //}

                        //Product.create([{
                            //name: 'Test product',
                            //price: 0,
                            //description: 'Test description',
                            //type: pt._id,
                        //}, {
                            //name: 'Test product also',
                            //price: 100,
                            //description: 'Test description',
                            //type: pt._id,
                        //}], function(err, ps) {
                            //if (err) {
                                //return done(err);
                            //}

                            //EventAddon.create([{
                                //capacity: 1,
                                //product: ps[0]._id,
                            //}, {
                                //capacity: 1,
                                //product: ps[1]._id,
                            //}], function(err, addons) {
                                //if (err) {
                                    //return done(err);
                                //}

                                //ev.addons.push(addons[0]);
                                //ev.addons.push(addons[1]);
                                //ev.save(function(err, updatedEvent) {
                                    //if (err) {
                                        //return done(err);
                                    //}

                                    //Event.findById(ev._id).populate({
                                        //path: 'addons',
                                        //populate: {
                                            //path: 'product'
                                        //},
                                    //}).exec(function(err, e) {
                                        //if (err) {
                                            //return done(err);
                                        //}

                                        //ewbEvent = e;

                                        //done();
                                    //});
                                //});
                            //});
                        //});
                    //});
                //});
            //});
        //});

        //it('should create a Stripe token', function(done) {
            //stripe.tokens.create({
                //card: {
                    //number: '4000000000000002',
                    //exp_month: 12,
                    //exp_year: moment().add(1, 'year').format('YYYY'),
                    //cvc: 666,
                //}
            //}, function(err, token) {
                //if (err) {
                    //return done(err);
                //}
                //stripeToken = token;
                //done();
            //});
        //});

        //it('should reject payment', function(done) {
            //agent.post('/api/payments/confirm-event').send({
                //stripeToken: stripeToken,
                //participant: {
                    //name: 'Some guy',
                    //email: 'dan.johansson@ingenjorerutangranser.se',
                //},
                //identifier: ewbEvent.identifier,
                //addonIds: _.map(ewbEvent.addons, '_id'),
            //}).expect(400).expect(function(res) {
                //if (!res.body.errorType) {
                    //throw new Error('Missing error type');
                //}
            //}).end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});

        //it('should not have changed addon capacity', function(done) {
            //Event.findById(ewbEvent._id).populate({
                //path: 'addons',
            //}).exec(function(err, e) {
                //if (err) {
                    //return done(err);
                //}

                //var pre = _.map(ewbEvent.addons, 'capacity').reduce((a,b) => a + b);
                //var foo = _.map(e.addons, 'capacity').reduce((a,b) => a + b);

                //if (foo < pre) {
                    //return done(new Error('Capacity decreased'));
                //}

                //done();
            //});
        //});

        //it('should not have changed event participants', function(done) {
            //Event.findById(ewbEvent._id).populate({
                //path: 'addons',
            //}).exec(function(err, e) {
                //if (err) {
                    //return done(err);
                //}

                //if (e.participants.length) {
                    //return done(new Error('Participant appeared'));
                //}

                //done();
            //});
        //});

        //after(function(done) {
            //removeEvent(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
        //});
    //});
//});

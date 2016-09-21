'use strict';



//var should = require('should');

var expect = require('chai').expect;
var moment = require('moment');
var request = require('supertest');
var app = require('../../app');
var stripe = require('stripe')('***REMOVED***');

var agent = request.agent(app);

var db = require('../../db').db;

var Member = require('../../models/member.model');
var Payment = require('../../models/payment.model');
var Product = require('../../models/product.model');

describe('Payment controller', function() {
    var productId;
    var memberId;
    var token;

    before(function(done) {
        Product.createProductType('Member').then(productType => {
            return Product.createProduct(productType.id, {
                name: 'Foo',
                price: 100,
                description: 'This is a description',
                attribute: {
                    durationDays: 365,
                    memberType: 'student',
                }
            });
        }).then(product => {
            productId = product.id;

            Member.createAuthenticatable('admin@admin.com', 'password', 'admin').then(data => {
                memberId = data.id;

                agent.post('/auth/local')
                    .send({ email: 'admin@admin.com', password: 'password' })
                    .end((err, res) => {
                        token = res.body.token;
                        done();
                    });
            });
        }).catch(err => {
            console.log(err);
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
                return Payment.find(maybeMember.id);
            }).then(payments => {
                expect(payments.length).to.eql(1);
                done();
            }).catch(err => {
                done(err);
            });
        });
    });

    after(function(done) {
        db.none(`DELETE FROM member`).then(() => {
            return db.none(`DELETE FROM product`)
        }).then(() => {
            return db.none(`DELETE FROM product_type`);
        }).then(() => {
            done();
        });
    });
});




//var moment = require('moment');
//var _ = require('lodash');

//var stripe = require('stripe')('***REMOVED***');

//var Event = require('../../models/event.model');
//var EventAddon = require('../../models/event-addon.model');
//var EventParticipant = require('../../models/event-participant.model');
//var Member = require('../../models/member.model');
//var OutgoingMessage = require('../../models/outgoing-message.model');
//var Product = require('../../models/product.model');
//var ProductType = require('../../models/product-type.model');
//var User = require('../../models/user.model');

//var PaymentHelper = require('../payment/payment.helper');
//var ewbMail = require('../../components/ewb-mail');

//function createAdmin(callback) {
    //removeAdmin(function() {
        //User.create({
            //email: 'admin@admin.com',
            //role: 'admin',
            //password: 'admin',
        //}, function(err, user) {
            //callback(err, user);
        //});
    //});
//};

//function removeAdmin(callback) {
    //User.remove({
        //email: 'admin@admin.com',
    //}, function(err, user) {
        //callback(err, user);
    //});
//};

//function createProduct(callback) {
    //removeProduct(function() {
        //ProductType.create({
            //identifier: 'Member',
        //}, function(err, type) {
            //Product.create({
                //name: 'Test product',
                //type: type._id,
                //typeAttributes: {
                    //memberType: 'student',
                    //durationDays: 365,
                //},
                //price: 100,
            //}, function(err, p) {
                //callback(err, p);
            //});
        //});
    //});
//};

//function removeProduct(callback) {
    //ProductType.remove({}, function(err, result) {
        //Product.remove({}, function(err, result) {
            //callback(err, result);
        //});
    //});
//};

//describe('GET /api/payments (as admin)', function() {
    //var token;

    //before(function(done) {
        //createAdmin(function(err, user) {
            //if (err) {
                //return done(err);
            //}
            //done();
        //});
    //});

    //it('should fetch admin access token', function(done) {
        //agent
            //.post('/auth/local')
            //.send({ email: 'admin@admin.com', password: 'admin' })
            //.expect(200)
            //.end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //token = res.body.token;
                //done();
            //});
    //});

    //it('should fetch a list of payments', function(done) {
        //agent
            //.get('/api/payments')
            //.query({ access_token: token })
            //.expect(200)
            //.end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
    //});

    //after(function(done) {
        //removeAdmin(function() {
            //done();
        //});
    //});
//});

//describe('GET /api/payments (not signed in)', function() {
    //it('should not be authorized', function(done) {
        //agent
            //.get('/api/payments')
            //.expect(401)
            //.end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}
                //done();
            //});
    //});
//});

//describe('CONFIRM Membership payment process', function() {
    //describe('New member', function() {
        //var product;
        //var stripeToken;
        //var member;

        //before(function(done) {
            //Member.remove({}, function(err, res) {
                //if (err) {
                    //return done(err);
                //}

                //createProduct(function(err, p) {
                    //if (err) {
                        //return done(err);
                    //}
                    //product = p;
                    //done();
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
            //agent.post('/api/payments/confirm').send({
                //stripeToken: stripeToken,
                //productId: product._id,
                //name: 'Some name',
                //location: 'Some location',
                //profession: 'Some profession',
                //education: 'Some education',
                //email: 'ict@ingenjorerutangranser.se',
                //gender: 'other',
                //type: product.typeAttributes.memberType,
                //yearOfBirth: '1900',
            //}).expect(201).end(function(err, res) {
                //if (err) {
                    //return done(err);
                //}

                //member = res.body;

                //done();
            //});
        //});

        //it('should find a newly created member', function(done) {
            //Member.findOne({ email: member.email }, function(err, member) {
                //if (err) {
                    //return done(err);
                //}
                
                //if (!member) {
                    //return done(new Error('No such member'));
                //}

                //done();
            //});
        //});

        //it('should exist a receipt mail with correct subject containing the product specification', function(done) {
            //OutgoingMessage.findOne({
                //to: member.email,
                //subject: ewbMail.getSubject('receipt', { name: product.name }),
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //if (!m) {
                    //return done(new Error('No receipt message created'));
                //}

                //var listIsOkay = m.text.indexOf(PaymentHelper.formatProductList([product])) > -1;
                //if (!listIsOkay) {
                    //return done(new Error('Product list is wrong'));
                //}

                //var totalIsOkay = m.text.indexOf(PaymentHelper.formatTotal([product])) > -1;
                //if (!totalIsOkay) {
                    //return done(new Error('Total is wrong'));
                //}

                //done();

            //});
        //});

        //it('should exist a confirmation mail with New Member subject and body', function(done) {
            //OutgoingMessage.findOne({
                //to: member.email,
                //subject: ewbMail.getSubject('new-member'),
                //text: ewbMail.getBody('new-member'),
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //if (!m) {
                    //return done(new Error('No message created'));
                //}

                //done();
            //});
        //});

        //after(function(done) {
            //removeProduct(function(err, result) {
                //if (err) {
                    //return done(err);
                //}

                //Member.remove({ email: member.email }, function() {
                    //if (err) {
                        //return done(err);
                    //}

                    //OutgoingMessage.remove({}, function(err, res) {
                        //if (err) {
                            //return done(err);
                        //}
                        //done();
                    //});
                //});
            //});
        //});
    //});

    //describe('Existing member', function() {
        //var product;
        //var stripeToken;
        //var member;
        //var updatedMember;

        //before(function(done) {
            //Member.remove({}, function(err, res) {
                //if (err) {
                    //return done(err);
                //}

                //createProduct(function(err, p) {
                    //if (err) {
                        //return done(err);
                    //}
                    //product = p;

                    //Member.create({
                        //name: 'Some name',
                        //location: 'Some location',
                        //profession: 'Some profession',
                        //education: 'Some education',
                        //email: 'ict@ingenjorerutangranser.se',
                        //gender: 'other',
                        //type: product.typeAttributes.memberType,
                        //yearOfBirth: '1900',
                    //}, function(err, m) {
                        //if (err) {
                            //return done(err);
                        //}

                        //member = m;

                        //done();
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
            //agent
                //.post('/api/payments/confirm')
                //.send({
                    //stripeToken: stripeToken,
                    //productId: product._id,
                    //name: 'New name',
                    //location: 'New location',
                    //profession: 'New profession',
                    //education: 'New education',
                    //email: 'ict@ingenjorerutangranser.se',
                    //gender: 'male',
                    //type: 'senior',
                    //yearOfBirth: '2000',
                //})
                //.expect(201)
                //.end(function(err, res) {
                    //if (err) {
                        //return done(err);
                    //}

                    //updatedMember = res.body;

                    //done();
                //});
        //});

        //it('member attributes should be updated', function(done) {
            //var bs = [
                //updatedMember.name === 'New name',
                //updatedMember.location === 'New location',
                //updatedMember.profession === 'New profession',
                //updatedMember.education === 'New education',
                //updatedMember.gender === 'male',
                //updatedMember.type === 'senior',
                //updatedMember.yearOfBirth === '2000',
            //];

            //if (!bs.reduce((a, b) => a || b)) {
                //return done(new Error('Member fields not updated'));
            //}

            //done();
        //});

        //it('member expiration date should be extended', function(done) {
            //var days = moment(updatedMember.expirationDate).diff(moment(member.expirationDate), 'days');

            //// To account for leap years and stuff
            //if (days <= product.typeAttributes.durationDays - 2) {
                //return done(new Error('Member expiration date not extended'));
            //}
            
            //done();
        //});

        //it('should exist a confirmation mail with Renewal subject and body', function(done) {
            //OutgoingMessage.findOne({
                //to: member.email,
                //subject: ewbMail.getSubject('renewal'),
                //text: ewbMail.getBody('renewal'),
            //}, function(err, m) {
                //if (err) {
                    //return done(err);
                //}

                //if (!m) {
                    //return done(new Error('No message created'));
                //}

                //done();
            //});
        //});

        //after(function(done) {
            //removeProduct(function(err, result) {
                //if (err) {
                    //return done(err);
                //}
                //Member.remove({ email: member.email }, function() {
                    //if (err) {
                        //return done(err);
                    //}

                    //OutgoingMessage.remove({}, function(err, res) {
                        //if (err) {
                            //return done(err);
                        //}

                        //done();
                    //});
                //});
            //});
        //});
    //});

    //describe('New member - Stripe reject', function() {
        //var product;
        //var stripeToken;
        //var member;

        //before(function(done) {
            //Member.remove({}, function(err, res) {
                //if (err) {
                    //return done(err);
                //}

                //createProduct(function(err, p) {
                    //if (err) {
                        //return done(err);
                    //}
                    //product = p;
                    //done();
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
            //agent
                //.post('/api/payments/confirm')
                //.send({
                    //stripeToken: stripeToken,
                    //productId: product._id,
                    //name: 'Some name',
                    //location: 'Some location',
                    //profession: 'Some profession',
                    //education: 'Some education',
                    //email: 'ict@ingenjorerutangranser.se',
                    //gender: 'other',
                    //type: product.typeAttributes.memberType,
                    //yearOfBirth: '1900',
                //})
                //.expect(400)
                //.expect(function(res) {
                    //if (!res.body.errorType) {
                        //throw new Error('Missing error type');
                    //}
                //})
                //.end(function(err, res) {
                    //if (err) {
                        //return done(err);
                    //}

                    //member = res.body;

                    //done();
                //});
        //});

        //after(function(done) {
            //removeProduct(function(err, result) {
                //if (err) {
                    //return done(err);
                //}

                //Member.remove({ email: member.email }, function() {
                    //if (err) {
                        //return done(err);
                    //}

                    //done();
                //});
            //});
        //});
    //});

    //describe('Existing member - Stripe reject', function() {
        //var product;
        //var stripeToken;
        //var member;
        //var updatedMember;

        //before(function(done) {
            //Member.remove({}, function(err, res) {
                //if (err) {
                    //return done(err);
                //}

                //createProduct(function(err, p) {
                    //if (err) {
                        //return done(err);
                    //}
                    //product = p;

                    //Member.create({
                        //name: 'Some name',
                        //location: 'Some location',
                        //profession: 'Some profession',
                        //education: 'Some education',
                        //email: 'ict@ingenjorerutangranser.se',
                        //gender: 'other',
                        //type: product.typeAttributes.memberType,
                        //yearOfBirth: '1900',
                    //}, function(err, m) {
                        //if (err) {
                            //return done(err);
                        //}

                        //member = m;

                        //done();
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
            //agent
                //.post('/api/payments/confirm')
                //.send({
                    //stripeToken: stripeToken,
                    //productId: product._id,
                    //name: 'New name',
                    //location: 'New location',
                    //profession: 'New profession',
                    //education: 'New education',
                    //email: 'ict@ingenjorerutangranser.se',
                    //gender: 'male',
                    //type: 'senior',
                    //yearOfBirth: '2000',
                //})
                //.expect(400)
                //.expect(function(res) {
                    //if (!res.body.errorType) {
                        //throw new Error('Missing error type');
                    //}
                //})
                //.end(function(err, res) {
                    //if (err) {
                        //return done(err);
                    //}

                    //updatedMember = res.body;

                    //done();
                //});
        //});

        //after(function(done) {
            //removeProduct(function(err, result) {
                //if (err) {
                    //return done(err);
                //}
                //Member.remove({ email: member.email }, function() {
                    //if (err) {
                        //return done(err);
                    //}

                    //done();
                //});
            //});
        //});
    //});
//});

//describe('CONFIRM Event payment process', function() {

    //function removeEvent(callback) {
        //removeProduct(function() {
            //EventParticipant.remove({}, function(err, res) {
                //if (err) {
                    //return callback(err);
                //}
                //EventAddon.remove({}, function(err, res) {
                    //if (err) {
                        //return callback(err);
                    //}
                    //Event.remove({}, function(err, res) {
                        //if (err) {
                            //return callback(err);
                        //}
                        //OutgoingMessage.remove({}, function(err, res) {
                            //callback(err, res);
                        //});
                    //});
                //});
            //});
        //});
    //};

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

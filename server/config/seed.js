/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var moment = require('moment');
var _ = require('lodash');

var Buyer = require('../models/buyer.model');
var Event = require('../models/event.model');
var EventAddon = require('../models/event-addon.model');
var EventParticipant = require('../models/event-participant.model');
var Member = require('../models/member.model');
var OutgoingMessage = require('../models/outgoing-message.model');
var Payment = require('../models/payment.model');
var Product = require('../models/product.model');
var ProductType = require('../models/product-type.model');
var User = require('../models/user.model');

var ewbMail = require('../components/ewb-mail');

function createProducts(callback) {
    ProductType.find({}).remove(function() {
        console.log('Removed: Product types');

        ProductType.create([{
            identifier: 'Membership',
        }, {
            identifier: 'Event',
        }], function(err, types) {
            console.log('Created: Product types');

            Product.find({}).remove(function() {
                console.log('Removed: Products');
                Product.create([{
                    name: 'Medlemskap 1 år student',
                    type: types[0]._id,
                    typeAttributes: {
                        memberType: 'student',
                        durationDays: 365,
                    },
                    price: 40,
                }, {
                    name: 'Medlemskap 3 år student',
                    type: types[0]._id,
                    typeAttributes: {
                        memberType: 'student',
                        durationDays: 365 * 3,
                    },
                    price: 90,
                }, {
                    name: 'Medlemskap 1 år yrkesverksam',
                    type: types[0]._id,
                    typeAttributes: {
                        memberType: 'working',
                        durationDays: 365,
                    },
                    price: 100,
                }, {
                    name: 'Medlemskap 3 år yrkesverksam',
                    type: types[0]._id,
                    typeAttributes: {
                        memberType: 'working',
                        durationDays: 365 * 3,
                    },
                    price: 250,
                }, {
                    name: 'Medlemskap 1 år senior',
                    type: types[0]._id,
                    typeAttributes: {
                        memberType: 'senior',
                        durationDays: 365,
                    },
                    price: 100,
                }, {
                    name: 'Medlemskap 3 år senior',
                    type: types[0]._id,
                    typeAttributes: {
                        memberType: 'senior',
                        durationDays: 365 * 3,
                    },
                    price: 250,
                }], function(err, products) {
                    console.log('Created: Products');
                    callback(err, products);
                });
            });
        });
    });
};

function createOutgoingMessages(callback) {
    OutgoingMessage.find().remove(function() {
        console.log('Removed: Outgoing messages');
        OutgoingMessage.create([{
            from: ewbMail.sender(),
            to: 'dan.albin.johansson@gmail.com', 
            subject: ewbMail.getSubject('expiring'),
            text: ewbMail.getBody('expiring'),
        }, {
            from: ewbMail.sender(),
            to: 'dan.albin.johansson@gmail.com', 
            subject: ewbMail.getSubject('renewal'),
            text: ewbMail.getBody('renewal'),
            priority: 1,
        }], function(err, messages) {
            console.log('Created: Outgoing messages');
            callback(err, messages);
        })
    });
};

function createUsers(callback) {
    User.find({}).remove(function() {
        console.log('Removed: Users');
        User.create([{
            provider: 'local',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.com',
            password: 'test'
        }, {
            provider: 'local',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'Admin',
            email: 'admin@admin.com',
            password: 'admin'
        }], function(err, users) {
            console.log('Created: Users');
            callback(err, users);
        });
    });
};

function createMembers(callback) {
    Member.find({}).remove(function() {
        console.log('Removed: members');
        Member.create([{
            name: 'Some Guy',
            location: 'Somewhere',
            type: 'student',
            education: 'Yes',
            yearOfBirth: 1980,
            profession: 'Mapper',
            gender: 'male',
            email: 'some-guy@test.com',
        }, {
            name: 'Gunde Svan',
            location: 'Mora',
            type: 'working',
            education: 'Yes',
            yearOfBirth: 1800,
            profession: 'President',
            gender: 'male',
            email: 'gundesvan@test.com',
        }, {
            name: 'Arne Testman',
            location: 'Tensta',
            type: 'working',
            education: 'Yes',
            yearOfBirth: 1800,
            profession: 'President',
            gender: 'male',
            email: 'arne_testman@test.com',
        }, {
            name: 'Old member 1',
            location: 'Old Town',
            type: 'senior',
            education: 'Yes',
            yearOfBirth: 1800,
            profession: 'President',
            email: 'oldmember1@test.com',
            gender: 'female',
            createdAt: moment().subtract(3, 'month'),
            expirationDate: moment().subtract(1, 'month'),
        }, {
            name: 'Old member 2',
            location: 'Old Town',
            type: 'senior',
            education: 'No',
            yearOfBirth: 1800,
            profession: 'President',
            gender: 'other',
            email: 'oldmember2@test.com',
            createdAt: moment().subtract(3, 'month'),
            expirationDate: moment().subtract(1, 'month'),
        }], function(err, members) {
            console.log('Created: Named members');
            callback(err, members);
        });

        //var lotsOfMembers = [];
        //for (var i = 0; i < 10000; i++) {
            //lotsOfMembers.push({
                //name: 'Name ' + i,
                //location: 'Location',
                //type: 'working',
                //yearOfBirth: 1900,
                //gender: 'other',
                //education: 'Maybe',
                //profession: 'Profession',
                //email: 'name' + i + '@example.com',
                //createdAt: moment().subtract(3, 'month'),
            //});
        //}

        //Member.create(lotsOfMembers, function(err, members) {
            //console.log('Created: Dummy members');
        //});
    });

};

function purchaseProducts(members, callback) {
    Buyer.find({}).remove(function() {
        console.log('Removed: Buyers');
        var bs = _.map(members, function(m) {
            return {
                type: 'Member',
                documentId: m._id,
            };
        });

        Buyer.create(bs, function(err, buyers) {
            console.log('Created: Buyers');

            Product.find({}, function(err, products) {
                Payment.find({}).remove(function() {
                    console.log('Removed: Payments');

                    var ps = _.map(buyers, function(b) {
                        return {
                            buyer: b._id,
                            products: [ products[0]._id ],
                            // The cost of a product + a random donation amount
                            amount: products[0].price + Math.floor(Math.random() * 100),
                        };
                    });

                    Payment.create(ps, function(err, payments) {
                        console.log('Created: Payments');
                        callback(err, payments);
                    });
                });
            });
        });
    });
};

function createEvents(callback) {
    EventParticipant.find({}).remove(function() {
        console.log('Removed: Event participants');

        EventAddon.find({}).remove(function() {
            console.log('Removed: Event addons');

            Event.find({}).remove(function () {
                console.log('Removed: Events');

                ProductType.findOne({ identifier: 'Event' }, function(err, productType) {
                    Event.create({
                        name: 'Event 1',
                        description: 'Lorem ipsum',
                        active: true,
                        dueDate: moment().add(1, 'month'),
                        contact: 'owner@example.com',
                    }, function(err, ev) {
                        Product.create([{
                            name: 'Årsmöte',
                            price: 0,
                            type: productType._id,
                        }, {
                            name: 'Middag',
                            price: 150,
                            type: productType._id,
                        }], function(err, products) {
                            EventAddon.create([{
                                capacity: 200,
                                product: products[0]._id,
                            }, {
                                capacity: 40,
                                product: products[1]._id,
                            }], function(err, eventAddons) {
                                ev.addons.push(eventAddons[0]._id);
                                ev.addons.push(eventAddons[1]._id);
                                ev.save(function() {
                                    console.log('Created: Event with 2 addons');
                                    callback(err, ev);
                                });
                            })

                        });
                    });

                    Event.create({
                        name: 'Event 2',
                        description: 'Lorem ipsum here as well',
                        active: true,
                        dueDate: moment().subtract(1, 'days'),
                        contact: 'owner@example.com',
                    }, function(err, ev) {
                        Product.create({
                            name: 'Foo',
                            price: 99,
                            type: productType._id,
                        }, function(err, product) {
                            EventAddon.create({
                                capacity: 2,
                                product: product._id,
                            }, function(err, eventAddon) {
                                ev.addons.push(eventAddon._id);
                                ev.save(function() {
                                    console.log('Created: Event with 1 addon');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};


function seed() {
    // This function acts as a dummy function. To be used with callbacks
    var pass = function() { return true; };

    createUsers(pass);
    createOutgoingMessages(pass);

    createMembers(function(err, members) {
        createProducts(function(err, products) {
            purchaseProducts(members, function() {
                
            });
            createEvents(pass);
        });
    });
};

seed();


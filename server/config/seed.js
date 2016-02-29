/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var moment = require('moment');
var _ = require('lodash');

var User = require('../models/user.model');
var Member = require('../models/member.model');
var Payment = require('../models/payment.model');
var OutgoingMessage = require('../models/outgoing-message.model');
var Event = require('../models/event.model');
var EventVariant = require('../models/event-variant.model');
var EventParticipant = require('../models/event-participant.model');

var Product = require('../models/product.model');
var ProductType = require('../models/product-type.model');
var Buyer = require('../models/buyer.model');

var ewbMail = require('../components/ewb-mail');

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
            });
        });
    });
});


OutgoingMessage.find().remove(function() {
  console.log('Removed: Outgoing messages');
  OutgoingMessage.create({
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
  }, function() {
    console.log('Created: Outgoing messages');
  })
});

User.find({}).remove(function() {
    console.log('Removed: Users');
    User.create({
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
    }, function() {
        console.log('Created: Users');
    });
});

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
                        });
                    });
                });
            });
        });
    });


    var lotsOfMembers = [];
    for (var i = 0; i < 10000; i++) {
        lotsOfMembers.push({
            name: 'Name ' + i,
            location: 'Location',
            type: 'working',
            yearOfBirth: 1900,
            gender: 'other',
            education: 'Maybe',
            profession: 'Profession',
            email: 'name' + i + '@example.com',
            createdAt: moment().subtract(3, 'month'),
        });
    }

    Member.create(lotsOfMembers, function(err, members) {
        console.log('Created: Dummy members');
    });
});

EventParticipant.find({}).remove(function() {
    console.log('Removed: Event participants');
});

EventVariant.find({}).remove(function() {
    console.log('Removed: Event variants');

    Event.find({}).remove(function () {
        console.log('Removed: Events');

        Event.create({
            name: 'Event 1',
            description: 'Lorem ipsum',
            active: true,
            maxParticipants: 2,
            dueDate: moment().add(1, 'month'),
            contact: 'owner@example.com',
        }, function(err, ev) {
            EventVariant.create({
                event: ev._id,
                name: 'Event variant 1',
                price: 0,
                description: 'Base',
            }, function(err, evv1) {
                EventVariant.create({
                    event: ev._id,
                    name: 'Event variant 2',
                    price: 150,
                    description: 'Improved',
                }, function(err, evv2) {
                    ev.variants.push(evv1);
                    ev.variants.push(evv2);
                    ev.save(function(err, evSaved) {
                        console.log('Created: Event with 2 variants');
                    });
                });
            });
        });

        Event.create({
            name: 'Event 2',
            description: 'Lorem ipsum',
            active: true,
            maxParticipants: 20,
            dueDate: moment().add(1, 'month'),
            contact: 'owner@example.com',
        }, function(err, ev) {
            EventVariant.create({
                name: 'Some other variant',
                price: 99,
                description: 'Yes',
            }, function(err, evv) {
                ev.variants.push(evv);
                ev.save(function(err, saved) {
                    console.log('Created: Event with 1 variant');
                });
            });
        });
    });
});

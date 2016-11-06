'use strict';

var expect = require('chai').expect;
var moment = require('moment');

var db = require('../db').db;

var EmailTemplate = require('./email-template.model');
var Event = require('./event.model');
var EventAddon = require('./event-addon.model');
var Member = require('./member.model');
var Product = require('./product.model');
var ProductType = require('./product-type.model');

describe('Event model', function() {
    beforeEach(function(done) {
        ProductType.create(ProductType.EVENT).then(() => {
            done();
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
            return db.none(`DELETE FROM product`);
        }).then(() => {
            return db.none(`DELETE FROM product_type`);
        }).then(() => {
            return db.none(`DELETE FROM member`);
        }).then(() => {
            done();
        });
    });

    describe('Create', function() {
        it('should create event', function(done) {
            let before;
            Event.index().then(es => {
                before = es.length;

                return Event.create({
                    name: 'event',
                    identifier: 'identifier',
                    active: true,
                    dueDate: moment().add(1, 'month').toDate(),
                    notificationOpen: false,
                    emailTemplate: {
                        sender: 'ict@ingenjorerutangranser.se',
                        subject: 'subject',
                        body: 'body',
                    },
                    addons: [{
                        capacity: 100,
                        name: 'Free',
                        description: 'Free description',
                        price: 0,
                    }]
                });
            }).then(e => {
                return Event.index();
            }).then(es => {
                expect(es.length).to.equal(before + 1);

                done();
            });
        });

        it('should create event with multiple addons', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {
                    capacity: 1000,
                    name: 'Not free',
                    description: 'Description',
                    price: 100,
                }, {
                    capacity: 200,
                    name: 'Name',
                    description: 'Description',
                    price: 200,
                }]
            }).then(e => {
                return Event.get(e.id);
            }).then(e => {
                expect(e.addons.length).to.equal(3);

                done();
            });
        });

        it('should fail to create event with no attributes', function(done) {
            Event.create({}).catch(err => {
                done();
            });
        });

        it('should fail to create event with no identifier', function(done) {
            Event.create({
                name: 'event',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {
                    capacity: 1000,
                    name: 'Not free',
                    description: 'Description',
                    price: 100,
                }, {
                    capacity: 200,
                    name: 'Name',
                    description: 'Description',
                    price: 200,
                }]
            }).catch(err => { done(); });
        });

        it('should fail to create event with email template', function(done) {
            Event.create({
                name: 'event',
                active: true,
                identifier: 'identifier',
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {},
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {
                    capacity: 1000,
                    name: 'Not free',
                    description: 'Description',
                    price: 100,
                }, {
                    capacity: 200,
                    name: 'Name',
                    description: 'Description',
                    price: 200,
                }]
            }).catch(err => { done(); });
        });

        it('should fail to create event with multiple addons', function(done) {
            Event.create({
                name: 'event',
                active: true,
                identifier: 'identifier',
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {}, {}
                ]
            }).catch(err => { done(); });
        });

        it('should fail to create event with no addons', function(done) {
            let productType;
            let productsBefore;

            ProductType.find(ProductType.EVENT).then(pt => {
                productType = pt;

                return Product.findByProductTypeId(pt.id);
            }).then(ps => {
                productsBefore = ps.length;
            }).then(() => {
                return Event.create({
                    name: 'event',
                    active: true,
                    identifier: 'identifier',
                    dueDate: moment().add(1, 'month').toDate(),
                    notificationOpen: false,
                    emailTemplate: {
                        sender: 'ict@ingenjorerutangranser.se',
                        subject: 'subject',
                        body: 'body',
                    },
                });
            }).catch(err => {

                Product.findByProductTypeId(productType.id).then(ps => {
                    expect(productsBefore).to.equal(ps.length);

                    done();
                });
            });
        });
    });

    describe('Read', function() {
        it('should fetch all events', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(() => {
                return Event.index();
            }).then(es => {
                expect(es.length).to.equal(1);

                done();
            });
        });

        it('should fetch single event', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(e => {
                return Event.get(e.id);
            }).then(e => {
                done();
            });
        });

        it('should fail to fetch single event', function(done) {
            let event;

            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(e => {
                event = e;

                return Event.destroy(e.id);
            }).then(() => {
                return Event.get(event.id);
            }).then(e => {
                expect(e).to.equal(null);

                done();
            });
        });

        it('should fetch event with addons', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {
                    capacity: 100,
                    name: 'Not free',
                    description: 'Free description',
                    price: 100,
                }]
            }).then(e => {
                return Event.findWithAddons('no match');
            }).then(e => {
                expect(e).to.equal(null);

                done();
            });
        });

        it('should fetch event with addons', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {
                    capacity: 100,
                    name: 'Not free',
                    description: 'Free description',
                    price: 100,
                }]
            }).then(e => {
                return Event.findWithAddons(e.identifier);
            }).then(e => {
                expect(e.addons.length).to.equal(2);

                done();
            });
        });

        it('should find events from criterias', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {
                    capacity: 100,
                    name: 'Not free',
                    description: 'Free description',
                    price: 100,
                }]
            }).then(e => {
                return Event.findBy({ name: 'event' });
            }).then(es => {
                expect(es.length).to.equal(1);

                return Event.findBy({ identifier: 'no match' });
            }).then(es => {
                expect(es.length).to.equal(0);

                done();
            });
        });
    });

    describe('Update', function() {
        it('should update event', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }, {
                    capacity: 100,
                    name: 'Not free',
                    description: 'Free description',
                    price: 100,
                }]
            }).then(e => {
                return Event.update(e.id, { name: 'new name', active: false });
            }).then(e => {
                expect(e.name).to.equal('new name');
                expect(e.active).to.equal(false);

                done();
            });
        });

        it('should add addon to event', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(e => {
                return EventAddon.create({
                    eventId: e.id,
                    capacity: 200,
                    price: 200,
                    name: 'Some name',
                    description: 'Some description',
                });
            }).then(() => {
                return Event.findWithAddons('identifier');
            }).then(e => {
                expect(e.addons.length).to.equal(2);
                expect(e.addons[0].name).to.equal('Free');
                expect(e.addons[1].name).to.equal('Some name');

                done();
            });
        });

        it('should remove email template from event');
        it('should remove addon from event');

        it('should fail to update event', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(e => {
                return Event.update(e.id, { missingKey: 'value' });
            }).catch(err => {
                done();
            });
        });
    });

    describe('Delete', function() {
        it('should delete event', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(e => {
                return Event.destroy(e.id);
            }).then(() => {
                return Event.index();
            }).then(es => {
                expect(es.length).to.equal(0);

                done();
            });
        });

        it('should fail to delete event');
    });

    describe('Participants', function() {
        it('should add participant', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 100,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(e => {
                return Event.get(e.id);
            }).then(e => {
                return Event.addParticipant(e, {
                    email: 'name@example.com',
                    addonIds: [e.addons[0]],
                });
            }).then(() => {
                return Event.findWithAddons('identifier');
            }).then(e => {
                expect(e.addons[0].capacity).to.equal(99);

                done();
            });
        });

        it('should add participant that is an existing member', function(done) {
            Member.create({ email: 'some@example.com' }).then(() => {
                return Event.create({
                    name: 'event',
                    identifier: 'identifier',
                    active: true,
                    dueDate: moment().add(1, 'month').toDate(),
                    notificationOpen: false,
                    emailTemplate: {
                        sender: 'ict@ingenjorerutangranser.se',
                        subject: 'subject',
                        body: 'body',
                    },
                    addons: [{
                        capacity: 100,
                        name: 'Free',
                        description: 'Free description',
                        price: 0,
                    }]
                });
            }).then(e => {
                return Event.get(e.id);
            }).then(e => {
                return Event.addParticipant(e, {
                    email: 'some@example.com',
                    addonIds: [e.addons[0]],
                });
            }).then(() => {
                return Event.findWithAddons('identifier');
            }).then(e => {
                expect(e.addons[0].capacity).to.equal(99);

                done();
            });
        });

        it('should fail to add participant to full event', function(done) {
            Event.create({
                name: 'event',
                identifier: 'identifier',
                active: true,
                dueDate: moment().add(1, 'month').toDate(),
                notificationOpen: false,
                emailTemplate: {
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'subject',
                    body: 'body',
                },
                addons: [{
                    capacity: 0,
                    name: 'Free',
                    description: 'Free description',
                    price: 0,
                }]
            }).then(e => {
                return Event.get(e.id);
            }).then(e => {
                return Event.addParticipant(e, {
                    email: 'name@example.com',
                    addonIds: [e.addons[0]],
                });
            }).catch(err => {
                done();
            });
        });
    });
});

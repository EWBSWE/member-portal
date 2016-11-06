'use strict';

var expect = require('chai').expect;
var moment = require('moment');

var db = require('../db').db;

var OutgoingMessage = require('./outgoing-message.model');

describe('Outgoing message model', function() {
    beforeEach(function(done) {
        done();
    });

    afterEach(function(done) {
        db.any('DELETE FROM outgoing_message').then(() => {
            done();
        });
    });
    
    describe('Create', function() {
        it('should create an outgoing message', function(done) {
            OutgoingMessage.create({
                recipient: 'test@example.com',
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'test',
                body: 'body'
            }).then(om => {
                done();
            });
        });
    });

    describe('Read', function() {
        it('should fetch n outgoing messages', function(done) {
            OutgoingMessage.create({
                recipient: 'test@example.com',
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'test',
                body: 'body'
            }).then(om => {
                return OutgoingMessage.create({
                    recipient: 'test2@example.com',
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'test2',
                    body: 'body2'
                });
            }).then(() => {
                return OutgoingMessage.fetch(1);
            }).then(oms => {
                expect(oms.length).to.equal(1);

                return OutgoingMessage.fetch(3);
            }).then(oms => {
                expect(oms.length).to.equal(2);

                done();
            });
        });

        it('should fetch messages with higher priority', function(done) {
            OutgoingMessage.create({
                recipient: 'test@example.com',
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'test',
                body: 'body'
            }).then(om => {
                return OutgoingMessage.create({
                    recipient: 'test2@example.com',
                    sender: 'ict@ingenjorerutangranser.se',
                    subject: 'test2',
                    body: 'body2',
                    priority: 1
                });
            }).then(() => {
                return OutgoingMessage.fetch(1);
            }).then(oms => {
                expect(oms.length).to.equal(1);
                expect(oms[0].subject).to.equal('test2');

                done();
            });
        });

        it('should not fetch messages that are not yet to be sent', function(done) {
            OutgoingMessage.create({
                recipient: 'test@example.com',
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'test',
                body: 'body',
                sendAt: moment().add(1, 'month').toDate(),
            }).then(() => {
                return OutgoingMessage.fetch(1);
            }).then(oms => {
                expect(oms.length).to.equal(0);

                done();
            });
        });

        it('should find messages for a recipient', function(done) {
            OutgoingMessage.create({
                recipient: 'test@example.com',
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'test',
                body: 'body',
            }).then(() => {
                return OutgoingMessage.find('test@example.com');
            }).then(oms => {
                expect(oms.length).to.equal(1);

                done();
            });
        });
    });

    describe('Update', function() {
        it('should increment counter if failed to send', function(done) {
            OutgoingMessage.create({
                recipient: 'test@example.com',
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'test',
                body: 'body',
            }).then(om => {
                return OutgoingMessage.fail(om.id);
            }).then(om => {
                expect(om.failed_attempts).to.equal(1);

                done();
            });
        });
    });

    describe('Delete', function() {
        it('should delete an outgoing message', function(done) {
            OutgoingMessage.create({
                recipient: 'test@example.com',
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'test',
                body: 'body',
            }).then(om => {
                return OutgoingMessage.remove(om.id);
            }).then(() => {
                return OutgoingMessage.fetch(1);
            }).then(oms => {
                expect(oms.length).to.equal(0);

                done();
            });
        });
    });
});


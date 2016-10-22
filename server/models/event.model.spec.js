'use strict';

var moment = require('moment');

var db = require('../db').db;

var Event = require('./event.model');
var Product = require('./product.model');

describe('event model', function() {
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
            return db.none(`DELETE FROM product`);
        }).then(() => {
            return db.none(`DELETE FROM product_type`);
        }).then(() => {
            done();
        }).catch(err => {
            console.log(err);
            done(err);
        });
    });

    it('should add participant', function() {
        return Event.addParticipant(event, {
            email: 'test@example.com',
            addonIds: [event.addons[0]],
            message: undefined
        });
    });
});

//var mongoose = require('mongoose');
//var Schema = mongoose.Schema;
//var moment = require('moment');

//var EventAddon = require('./event-addon.model');
//var EventParticipant = require('./event-participant.model');
//var Payment = require('./payment.model');

//var EventSchema = new Schema({
    //name: { type: String, required: true, trim: true },
    //identifier: { type: String, lowercase: true, unique: true },
    //description: { type: String, required: true }, 
    //active: { type: Boolean, required: true, default: true },
    //createdAt: { type: Date, required: true, default: Date.now },
    //participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventParticipant' }],
    //dueDate: { type: Date, required: true },
    //contact: { type: String, required: true },
    //addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventAddon' }],
    //confirmationEmail: {
        //subject: { type: String, required: true },
        //body: { type: String, required: true },
    //},
    //notificationOpen: { type: Boolean, required: true, default: true },
    //subscribers: [{ type: String, trim: true, lowercase: true }],
    //payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
//});

//EventSchema.index({ identifier: 1 });

//module.exports = mongoose.model('Event', EventSchema);

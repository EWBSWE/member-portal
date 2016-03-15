'use strict';

var _ = require('lodash');

var Event = require('../../models/event.model');
var EventAddon = require('../../models/event-addon.model');
var EventParticipant = require('../../models/event-participant.model');
var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

exports.fetchEvent = fetchEvent;
exports.createParticipant = createParticipant;
exports.updateAddons = updateAddons;
exports.sumAddons = sumAddons;
exports.removeAddons = removeAddons;
exports.createAddons = createAddons;
exports.generateSummary = generateSummary;
exports.formatSummary = formatSummary;

function fetchEvent(identifier, callback) {
    Event.findOne({
        identifier: identifier,
        active: true
    }).populate({
        path: 'addons',
        populate: {
            path: 'product',
        },
    }).exec(function(err, ewbEvent) {
        return callback(err, ewbEvent);
    });
};

function createParticipant(data, callback) {
    EventParticipant.create(data, function(err, participant) {
        callback(err, participant);
    });
};

function sumAddons(addons) {
    var sum = 0;

    for (var i = 0; i < addons.length; i++) {
        sum += addons[i].product.price;
    }

    return sum;
};

function updateAddons(addonIds, callback) {
    EventAddon.find({
        _id: {
            $in: addonIds,
        }
    }, function(err, addons) {
        if (err) {
            return callback(err);
        }

        EventAddon.update({
            _id: {
                $in: addonIds,
            }
        }, {
            $inc: { capacity: -1 },
        }, {
            multi: true,
        }, function(err, result) {
            return callback(err, result);
        });
    });
};

function removeAddons(addons, callback) {
    var productsToRemove = _.map(addons, 'product');
    var addonsToRemove = _.map(addons, '_id');

    Product.remove({
        _id: {
            $in: productsToRemove,
        },
    }, function(err, result) {
        if (err) {
            return callback(err);
        }

        EventAddon.remove({
            _id: {
                $in: addonsToRemove
            },
        }, function(err, result) {
            if (err) {
                return callback(err);
            }

            return callback(err, result);
        });
    });
};

function createAddons(ewbEvent, data, callback) {
    ProductType.findOne({ identifier: 'Event' }, function(err, productType) {
        if (err) {
            return callback(err);
        }

        Product.create(_.map(data, function(d) {
            return {
                name: d.name,
                price: d.price,
                type: productType._id
            };
        }), function(err, products) {
            if (err) {
                return callback(err);
            }

            var as = [];
            for (var i = 0; i < products.length; i++) {
                as.push({ capacity: data[i].capacity, product: products[i]._id });
            }

            EventAddon.create(as, function(err, addons) {
                if (err) {
                    return callback(err);
                }

                ewbEvent.addons = ewbEvent.addons.concat(addons);
                ewbEvent.save(function(err, updatedEvent) {
                    return callback(err, updatedEvent);
                });
            });
        });
    });
};

function generateSummary(ewbEvent) {
    var summary = [];

    _.each(ewbEvent.payments, function(payment) {
        var matchingAddons = [];
        for (var i = 0; i < ewbEvent.addons.length; i++) {
            var product = ewbEvent.addons[i].product;
            for (var j = 0; j < payment.products.length; j++) {
                if (product._id.equals(payment.products[j])) {
                    matchingAddons.push(ewbEvent.addons[i]);
                }
            }
        }

        summary.push({
            name: payment.buyer.document.name,
            email: payment.buyer.document.email,
            comment: payment.buyer.document.comment,
            amount: payment.amount,
            addons: _.map(matchingAddons, function(a) {
                return a.product.name;
            }).join(', '),
        });
    });

    return summary;
};

function formatSummary(summary) {
    var text = 'Antal anmälningar: ' + summary.length + '\n\n' +
        'Namn\t\t\t Epost\t\t\t Betalt\t\t Val\t\t Kommentar\n' +
        '----\t\t\t -----\t\t\t ------\t\t ---\t\t ---------\n';

    for (var i = 0; i < summary.length; i++) {
        var entry = summary[i];
        text += entry.name + '\t ' + entry.email + '\t ' + entry.amount + '\t\t ' + entry.addons + '\t ' + (entry.comment || '') + '\n';
    }

    return text;
};





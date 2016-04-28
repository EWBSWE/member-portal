'use strict';

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');

var Buyer = require('../../models/buyer.model');
var Event = require('../../models/event.model');
var EventAddon = require('../../models/event-addon.model');
var Payment = require('../../models/payment.model');

var Setting = require('../../models/setting.model');

exports.createBuyer = createBuyer;
exports.generateReport = generateReport;
exports.formatReport = formatReport;

function createBuyer(type, documentRef, callback) {
    Buyer.create({
        type: type,
        document: documentRef
    }, function(err, buyer) {
        if (err) {
           return callback(err);
        }

        return callback(err, buyer);
    });
};

function generateReport(params, callback) {
    function fetchSettings(callback) {
        Setting.find({
            key: {
                $in: [
                    'StripeTransactionFeePercent', 
                    'StripeTransactionFeeFlat', 
                ],
            },
        }, function(err, settings) {
            callback(err, settings);
        });
    };

    function fetchPayments(callback) {
        Payment.find({
            createdAt: {
                $gte: moment(params.periodStart).startOf('day'),
                $lte: moment(params.periodEnd).endOf('day'),
            }
        }).populate({
            path: 'products',
            populate: {
                path: 'type',
            },
        }).exec(function(err, payments) {
            callback(err, payments);
        });
    };

    function fetchPossibleEvents(payments, callback) {
        var temp = {};

        _.each(payments, function(payment) {
            _.each(payment.products, function(product) {
                temp[product._id] = true;
            });
        });

        var productIds = Object.keys(temp);

        EventAddon.find({
            product: {
                $in: productIds,
            },
        }, function(err, addons) {
            if (err) {
                return callback(err);
            }

            var addonIds = _.map(addons, '_id');

            Event.find({
                addons: {
                    $in: addonIds,
                },
            }).populate({
                path: 'addons',
                populate: {
                    path: 'product',
                },
            }).exec(function(err, ewbEvents) {
                callback(err, ewbEvents);
            });
        });
    };
    
    function calculateStuff(settings, payments, ewbEvents) {
        var stripeFeePercent = parseFloat(_.find(settings, {
            key: 'StripeTransactionFeePercent'
        }).value);

        var stripeFeeFlat = parseFloat(_.find(settings, {
            key: 'StripeTransactionFeeFlat'
        }).value);

        var computeTransaction = function(price) {
            return price * (1 - stripeFeePercent) - stripeFeeFlat;
        };

        // We only care about the payments processed by Stripe. And we only use
        // Stripe if the amount paid is greater than 0.
        var processedPayments = _.filter(payments, function(payment) {
            return payment.amount > 0;
        });

        var data = {};

        _.each(processedPayments, function(payment) {
            // Amount left after processed by Stripe. May include products and a donation sum.
            var paymentTotal = computeTransaction(payment.amount);

            // The sum of product prices. This is equivalent to what the user
            // paid assuming no donation.
            var productTotal = _.map(payment.products, 'price').reduce(function(a,b) {
                return a + b;
            }, 0);

            // The donation amount is what remains after the products has been
            // accounted for. If anything remains that is.
            var donationAmount = paymentTotal - productTotal < 0 ? 0 : paymentTotal - productTotal;

            // Determine what each payment is categorized as. Either a specific
            // event or a membership type. All products are unique to an event
            // or membership.
            var someProduct = payment.products[0];
            var paymentIdentifier = someProduct.type.identifier;

            // Something is either a membership product or an event addon. In
            // either way we can use its name property.
            var something = someProduct;

            if (paymentIdentifier === 'Event') {
                _.each(ewbEvents, function(ewbEvent) {
                    _.each(ewbEvent.addons, function(addon) {
                        if (addon.product._id.equals(someProduct._id)) {
                            something = ewbEvent;
                        }
                    });
                });
            } 

            if (data[something.name]) {
                data[something.name].products += paymentTotal;
                data[something.name].donations += donationAmount;
            } else {
                data[something.name] = {
                    products: paymentTotal,
                    donations: donationAmount,
                };
            }
        });

        callback(null, data);
    };

    fetchSettings(function(err, settings) {
        if (err) {
            return callback(err);
        }

        fetchPayments(function(err, payments) {
            if (err) {
                return callback(err);
            }

            fetchPossibleEvents(payments, function(err, ewbEvents) {
                if (err) {
                    return callback(err);
                }

                calculateStuff(settings, payments, ewbEvents, function(err, data) {
                    if (err) {
                        return callback(err);
                    }

                    callback(err, data);
                });
            });
        });
    });
};

function formatReport(data) {
    var space = ' ';
    for (var i = 0; i < Object.keys(data).length; i++) {
        var key = Object.keys(data)[i];
        if (key.length > space.length) {
            space = new Array(key.length + 3).join(' ');
        }
    }

    var text = 'Typ' + space + '\tNetto EWB\n';
    text += '---' + space + '\t---------\n';

    for (var i = 0; i < Object.keys(data).length; i++) {
        var key = Object.keys(data)[i];
        var keySpace = new Array(space.length - key.length).join(' ');
        var row = key + keySpace + '\t' + data[key].products.toFixed(2) + '\n';
        text += row;
    }

    var sum = _.map(data, 'products').reduce(function(a,b) {
        return a + b;
    }, 0);

    text += '\n\nSum: ' + sum.toFixed(2);

    return text;
};

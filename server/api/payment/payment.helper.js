'use strict';

var _ = require('lodash');
var moment = require('moment');

var Buyer = require('../../models/buyer.model');
var Payment = require('../../models/payment.model');

exports.fetchOrCreateBuyer = fetchOrCreateBuyer;
exports.generateReport = generateReport;

function fetchOrCreateBuyer(type, documentId, callback) {
    Buyer.findOne({
        type: type,
        documentId: documentId
    }, function(err, maybeBuyer) {
        if (err) {
            return callback(err);
        }

        // Buyer exists, return it
        if (maybeBuyer) {
            return callback(err, maybeBuyer);
        }

        Buyer.create({
            type: type,
            documentId: documentId
        }, function(err, buyer) {
            if (err) {
               return callback(err);
            }

            return callback(err, buyer);
        })
    })
};

function generateReport(params, callback) {
    Payment.find({
        createdAt: {
            $gte: moment(params.periodStart).startOf('day'),
            $lt: moment(params.periodEnd).endOf('day'),
        }
    }, function(err, payments) {
        if (err) {
            callback(err);
        }

        console.log(payments);

        callback(err, payments);
    });
};

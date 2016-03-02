'use strict';

var _ = require('lodash');

var Buyer = require('../../models/buyer.model');
var Payment = require('../../models/payment.model');

exports.fetchOrCreateBuyer = fetchOrCreateBuyer;

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



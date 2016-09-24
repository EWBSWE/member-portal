'use strict';

var _ = require('lodash');

var Promise = require('bluebird');

var stripe = require('stripe')('***REMOVED***');
if (process.env.NODE_ENV === 'production') {
    stripe = require('stripe')('sk_live_aRwKpgsqwq7rpsozBg43Clx5');
}

var moment = require('moment');
//var mongoose = require('mongoose');

//var Buyer = require('../../models/buyer.model');
var ewbError = require('../../models/ewb-error.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var Payment = require('../../models/payment.model');
var Product = require('../../models/product.model');

var EmailHelper = require('../../helpers/email.helper');
var EventHelper = require('../event/event.helper');
var MemberHelper = require('../member/member.helper');
var PaymentHelper = require('../payment/payment.helper');

var ewbMail = require('../../components/ewb-mail');


var Purchase = require('../../helpers/purchase.helper');


exports.index = function(req, res, next) {
    Payment.index().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};

exports.get = function(req, res, next) {
    Payment.get(req.params.id).then(data => {
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};

exports.confirmMembershipPayment = function(req, res, next) {
    if (!req.body.stripeToken || !req.body.productId) {
        let badRequest = new Error('Missing parameters');
        badRequest.status = 404;
        return next(badRequest);
    }

    let stripeToken = req.body.stripeToken;
    let memberData = {
        email: req.body.email.trim(),
        name: req.body.name,
        location: req.body.location,
        profession: req.body.profession,
        education: req.body.education,
        type: req.body.type,
        gender: req.body.gender,
        yearOfBirth: req.body.yearOfBirth
    };

    Product.get(req.body.productId).then(product => {
        return new Promise((resolve, reject) => {
            processCharge({
                currency: product.currency_code,
                amount: product.price,
                description: product.name
            }, stripeToken, () => {
                resolve(product);
            }, err => {
                let badRequest = new Error('Stripe rejected');
                badRequest.status = 400;
                next(badRequest);
            });
        });
    }).then(product => {
        return Purchase.membership(product, memberData);
    }).then(data => {
        let member = data.member;
        let product = data.product;

        let receiptMail = {
            sender: ewbMail.sender(),
            recipient: member.email,
            subject: ewbMail.getSubject('receipt', { name: product.name }),
            body: ewbMail.getBody('receipt', {
                buyer: member.email,
                date: moment().format('YYYY-MM-DD HH:mm'),
                total: PaymentHelper.formatTotal([product]),
                tax: PaymentHelper.formatTax([product]),
                list: PaymentHelper.formatProductList([product]),
            }),
        };

        let confirmationMail = {
            sender: ewbMail.sender(),
            recipient: member.email,
            subject: 'foo', // TODO fix me
            body: 'bar', // TODO fix me
        };

        return OutgoingMessage.create(receiptMail).then(() => {
            return OutgoingMessage.create(confirmationMail);
        });
    }).then(() => {
        res.sendStatus(201);
    }).catch(err => {
        next(err);
    });
};

exports.confirmEventPayment = function(req, res, next) {
    
};

exports.confirmEventPayment = function(req, res) {
    function processEventPayments(ewbEvent, participantData, selectedAddons) {
        var sum = EventHelper.sumAddons(selectedAddons);

        return processCharge({
            currency: 'SEK',
            amount: sum,
            description: ewbEvent.name,
        }, req.body.stripeToken, function(charge) {
            // Successful charge
            return createEventParticipant(ewbEvent, participantData, selectedAddons);
        }, function(stripeError) {
            // Failed charge
            var error = handleStripeError(stripeError);
            return res.status(400).json(error);
        });
    };

    function createEventParticipant(ewbEvent, participantData, selectedAddons) {
        EventHelper.createParticipant({
            name: participantData.name,
            email: participantData.email,
            eventId: ewbEvent._id,
            comment: participantData.comment,
        }, function(err, eventParticipant) {
            if (err) {
                ewbError.create({ message: 'Error creating event participant', origin: __filename, params: err });
                return handleError(res, err);
            }

            return createPayment(ewbEvent, selectedAddons, eventParticipant);
        });
    };

    function createPayment(ewbEvent, selectedAddons, eventParticipant) {
        var sum = EventHelper.sumAddons(selectedAddons);
        var productIds = _.map(selectedAddons, function(a) {
            return a.product._id;
        });

        PaymentHelper.createBuyer('EventParticipant', eventParticipant._id, function(err, buyer) {
            if (err) {
                ewbError.create({ message: 'Error fetching buyer', origin: __filename, params: err });
                return handleError(res, err);
            }

            Payment.create({
                buyer: buyer._id,
                amount: sum,
                products: productIds
            }, function(err, payment) {
                if (err) {
                    ewbError.create({ message: 'Error creating payment event', origin: __filename, params: err });
                    return handleError(res, err);
                }

                return addToEvent(ewbEvent, selectedAddons, eventParticipant, payment);
            });
        });
    };

    function addToEvent(ewbEvent, selectedAddons, eventParticipant, payment) {
        ewbEvent.payments.push(payment);
        ewbEvent.participants.push(eventParticipant);
        ewbEvent.save(function(err, updatedEvent) {
            if (err) {
                ewbError.create({ message: 'Failed to update event participant', origin: __filename, params: err });
                return handleError(res, err);
            }

            return updateEventAddons(updatedEvent, selectedAddons, eventParticipant);
        });
    };

    function updateEventAddons(ewbEvent, selectedAddons, eventParticipant) {
        var addonIds = _.map(selectedAddons, '_id');

        EventHelper.updateAddons(addonIds, function(err, updatedAddons) {
            if (err) {
                ewbError.create({ message: 'Failed to update event addon', origin: __filename, params: err });
                return handleError(res, err);
            }

            return sendReceiptEmail(ewbEvent, eventParticipant, selectedAddons);
        });
    };

    function sendReceiptEmail(ewbEvent, eventParticipant, selectedAddons) {
        var products = _.map(selectedAddons, 'product');
        var receiptMail = {
            from: ewbMail.sender(),
            to: eventParticipant.email,
            subject: ewbMail.getSubject('receipt', { name: ewbEvent.confirmationEmail.subject }),
            text: ewbMail.getBody('receipt', {
                buyer: eventParticipant.email,
                date: moment().format('YYYY-MM-DD HH:mm'),
                total: PaymentHelper.formatTotal(products),
                tax: PaymentHelper.formatTax(products),
                list: PaymentHelper.formatProductList(products),
            }),
        };

        OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
            if (err) {
                ewbError.create({ message: 'Event receipt mail', origin: __filename, params: err });
            }

            return sendConfirmationEmail(ewbEvent, eventParticipant);
        });
    }

    function sendConfirmationEmail(ewbEvent, eventParticipant) {
        var confirmationMail = {
            from: ewbMail.sender(),
            to: eventParticipant.email,
            subject: ewbEvent.confirmationEmail.subject,
            text: ewbEvent.confirmationEmail.body,
        };

        OutgoingMessage.create(confirmationMail, function(err, outgoingMessage) {
            if (err) {
                ewbError.create({ message: 'Event confirmation mail', origin: __filename, params: err });
            }
        });
        
        return res.status(200).json(ewbEvent);
    }

    EventHelper.fetchEvent(req.body.identifier, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        if (!ewbEvent) {
            ewbError.create({ message: 'Event not found', origin: __filename, params: err });
            return res.status(400).json({ message: 'Event not found' });
        }

        var selectedAddonIds = _.map(req.body.addonIds, function(addonId) {
            return new mongoose.Types.ObjectId(addonId);
        });

        var selectedAddons = _.filter(ewbEvent.addons, function(addon) {
            for (var i = 0; i < selectedAddonIds.length; i++) {
                if (selectedAddonIds[i].equals(addon._id)) {
                    return true;
                }
            }
            return false;
        });

        var sum = EventHelper.sumAddons(selectedAddons);

        if (sum === 0) {
            // Skip payment step
            return createEventParticipant(ewbEvent, req.body.participant, selectedAddons);
        } else {
            return processEventPayments(ewbEvent, req.body.participant, selectedAddons);
        }
    });
};

exports.stripeCheckoutKey = function (req, res) {
    var key = '***REMOVED***';
    if (process.env.NODE_ENV === 'production') {
        key = 'pk_live_ATJZnfiF1iDDCQvNK6IgEFA2';
    }

    return res.status(200).json({ key: key });
};

exports.generateReport = function (req, res) {
    var periodStart = moment(req.body.periodStart);
    var periodEnd = moment(req.body.periodEnd);
    var recipient = req.body.recipient;

    var validParams = {
        periodStart: periodStart.isValid(),
        periodEnd: periodEnd.isValid(),
        recipient: EmailHelper.isValid(recipient),
    };

    var anyError = !_.values(validParams).reduce(function(a, b) {
        return a && b;
    }, true);

    if (anyError) {
        return res.status(400).json(validParams);
    } else {
        PaymentHelper.generateReport({
            periodStart: periodStart.format('YYYY-MM-DD'),
            periodEnd: periodEnd.format('YYYY-MM-DD'),
        }, function(err, data) {
            if (err) {
                ewbError.create({ message: 'Failed to generate report', origin: __filename, params: err });
                return handleError(res, err);
            }

            var text = PaymentHelper.formatReport(data);

            var mail = {
                from: ewbMail.sender(),
                to: process.env.NODE_ENV === 'production' ? recipient : process.env.DEV_MAIL,
                subject: 'EWB Report: ' + periodStart.format('YYYY-MM-DD') + ' - ' + periodEnd.format('YYYY-MM-DD'),
                text: text,
            };

            OutgoingMessage.create(mail, function(err, outgoingMessage) {
                if (err) {
                    ewbError.create({ message: 'Failed to create report mail', origin: __filename, params: err });
                }
            });

            return res.status(200).json(data);
        });
    }
};

function processCharge(chargeAttributes, stripeToken, successCallback, errorCallback) {
    stripe.charges.create({
        currency: chargeAttributes.currency,
        amount: chargeAttributes.amount * 100,
        source: stripeToken.id,
        description: chargeAttributes.description,
    }, function(err, charge) {
        if (err === null) {
            successCallback(charge);
        } else {
            ewbError.create('Stripe process charge', __filename, err);
            errorCallback(err);
        }
    });
};

function handleStripeError(err) {
    ewbError.create('Stripe charge error', __filename, err);
    return { errorType: err.type };
};


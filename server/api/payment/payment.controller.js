'use strict';

var _ = require('lodash');

var Promise = require('bluebird');

var stripe = require('stripe')('***REMOVED***');
if (process.env.NODE_ENV === 'production') {
    stripe = require('stripe')('sk_live_aRwKpgsqwq7rpsozBg43Clx5');
}

var moment = require('moment');

var ewbError = require('../../models/ewb-error.model');
var Event = require('../../models/event.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var Payment = require('../../models/payment.model');
var Product = require('../../models/product.model');

var EmailHelper = require('../../helpers/email.helper');
var EventHelper = require('../event/event.helper');
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
        badRequest.status = 400;
        return next(badRequest);
    }

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
            }, req.body.stripeToken, () => {
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
    if (!req.body.identifier || !Array.isArray(req.body.addonIds)) {
        let badRequest = new Error('Missing parameters');
        badRequest.status = 400;
        return next(badRequest);
    }

    Event.findWithAddons(req.body.identifier).then(event => {
        if (!event) {
            return res.sendStatus(404);
        }

        let selectedAddons = event.addons.filter(addon => { return req.body.addonIds.includes(addon.id); });
        let sum = selectedAddons.reduce((total, addon) => { return total + addon.price; }, 0);

        if (sum === 0) {
            return Promise.resolve(event);
        } else {
            if (!req.body.stripeToken) {
                let badRequest = new Error('Missing parameters');
                badRequest.status = 400;
                return next(badRequest);
            }

            return new Promise((resolve, reject) => {
                processCharge({
                    currency: 'SEK',
                    amount: sum,
                    description: event.name
                }, req.body.stripeToken, () => {
                    resolve(event);
                }, err => {
                    let badRequest = new Error('Stripe rejected');
                    badRequest.status = 400;
                    next(badRequest);
                });
            }).catch(err => {
                next(err);
            });
        }
    }).then(event => {
        return Event.addParticipant(event, {
            addonIds: req.body.addonIds,
            name: req.body.participant.name,
            email: req.body.participant.email,
            message: req.body.participant.message
        }).then(() => {
            return Event.findWithAddons(event.identifier);
        });
    }).then(event => {
        // Only keep addons that was selected
        event.addons = event.addons.filter(addon => { return req.body.addonIds.includes(addon.id); });

        return Promise.resolve(event);
    }).then(event => {
        if (event.email_template_id) {
            // TODO
            // If event has a custom email template.
            //EmailHelper.createFromTemplate(event.email_template_id);
        }

        let receiptMail = {
            sender: ewbMail.sender(),
            recipient: req.body.participant.email,
            subject: ewbMail.getSubject('receipt', { name: event.name }),
            body: ewbMail.getBody('receipt', {
                buyer: req.body.participant.email,
                date: moment().format('YYYY-MM-DD HH:mm'),
                total: PaymentHelper.formatTotal(event.addons),
                tax: PaymentHelper.formatTax(event.addons),
                list: PaymentHelper.formatProductList(event.addons),
            }),
        };

        return OutgoingMessage.create(receiptMail);
    }).then(() => {
        res.sendStatus(201);
    }).catch(err => {
        next(err);
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


/**
 * Payment controller
 *
 * @namespace controller.Payment
 * @memberOf controller
 */

'use strict';

var Promise = require('bluebird');

var stripe = require('stripe')('***REMOVED***');
if (process.env.NODE_ENV === 'production') {
    stripe = require('stripe')('sk_live_aRwKpgsqwq7rpsozBg43Clx5');
}

var moment = require('moment');

var Event = require('../../models/event.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var Payment = require('../../models/payment.model');
var Product = require('../../models/product.model');

var EmailHelper = require('../../helpers/email.helper');

var ewbMail = require('../../components/ewb-mail');

/**
 * Get all payments
 *
 * @memberOf controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.index = function(req, res, next) {
    Payment.index().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};

/**
 * Get payment
 *
 * @memberOf controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.get = function(req, res, next) {
    Payment.get(req.params.id).then(data => {
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};

/**
 * Confirm membership payment
 *
 * @memberOf controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
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
        return Member.extendMembership(memberData, product).then(member => {
            return Payment.create({
                member: member,
                products: [product],
            });
        }).then(() => {
            return Promise.resolve(product);
        });
    }).then(product => {
        let receiptMail = {
            sender: ewbMail.sender(),
            recipient: memberData.email,
            subject: ewbMail.getSubject('receipt', { name: product.name }),
            body: ewbMail.getBody('receipt', {
                buyer: memberData.email,
                date: moment().format('YYYY-MM-DD HH:mm'),
                total: Payment.formatTotal([product]),
                tax: Payment.formatTax([product]),
                list: Payment.formatProductList([product]),
            }),
        };

        let confirmationMail = {
            sender: ewbMail.sender(),
            recipient: memberData.email,
            subject: 'foo', // TODO fix me
            body: 'bar', // TODO fix me
        };

        return OutgoingMessage.create(receiptMail).then(() => {
            return OutgoingMessage.create(confirmationMail);
        });
    }).then(() => {
        res.sendStatus(201);
    }).catch(err => {
        console.log(err);
        next(err);
    });
};

/**
 * Confirm event payment
 *
 * @memberOf controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
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

        console.log('selected addons', selectedAddons, sum);
        console.log(req.body);

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
        return Event.addParticipant(event.id, {
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
                total: Payment.formatTotal(event.addons),
                tax: Payment.formatTax(event.addons),
                list: Payment.formatProductList(event.addons),
            }),
        };

        return OutgoingMessage.create(receiptMail);
    }).then(() => {
        res.sendStatus(201);
    }).catch(err => {
        next(err);
    });
};

/**
 * Get Stripe checkout key
 *
 * @memberof controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.stripeCheckoutKey = function (req, res) {
    var key = '***REMOVED***';
    if (process.env.NODE_ENV === 'production') {
        key = 'pk_live_ATJZnfiF1iDDCQvNK6IgEFA2';
    }

    return res.status(200).json({ key: key });
};

/**
 * Generate payment report
 *
 * @memberof controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
exports.generateReport = function (req, res, next) {
    var start = moment(req.query.start);
    var end = moment(req.query.end);
    var recipient = req.query.recipient;
    // TODO check valid params

    Payment.generateReport(start.toDate(), end.toDate()).then(report => {
        let mail = {
            sender: ewbMail.sender(),
            recipient: recipient,
            subject: 'EWB Report: ' + start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'),
            body: report,
        };

        return OutgoingMessage.create(mail);
    }).then(() => {
        return res.sendStatus(200);
    }).catch(err => {
        next(err);
    });
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
            errorCallback(err);
        }
    });
};


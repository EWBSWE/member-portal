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

const logger = require('../../config/logger');

var Event = require('../../models/event.model');
var Member = require('../../models/member.model');
var OutgoingMessage = require('../../models/outgoing-message.model');
var Payment = require('../../models/payment.model');
var Product = require('../../models/product.model');
var EmailTemplate = require('../../models/email-template.model');

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

    logger.info('Initiating membership payment');

    let memberData = {
        email: req.body.email.trim(),
        name: req.body.name,
        location: req.body.location,
        profession: req.body.profession,
        education: req.body.education,
        gender: req.body.gender,
        yearOfBirth: req.body.yearOfBirth
    };

    Product.get(req.body.productId).then(product => {
        logger.info('membership product', product);

        return new Promise((resolve, reject) => {
            logger.info('processing charge');

            processCharge({
                currency: product.currency_code,
                amount: product.price,
                description: product.name
            }, req.body.stripeToken, () => {
                logger.info('stripe processing successful');
                resolve(product);
            }, err => {
                logger.info('stripe processing failed');
                let badRequest = new Error('Stripe rejected');
                badRequest.status = 400;
                reject(badRequest);
            });
        });
    }).then(product => {
        // Attach member type id to memberData
        memberData.memberTypeId = product.attribute.member_type_id

        return Member.findBy({ email: memberData.email }).then(members => {
            if (members.length === 0) {
                logger.info('new member, creating');
                return Member.create(memberData);
            }

            logger.info('existing member, updating', {expirationDate: members[0].expiration_date, id: members[0].id, memberData});
            return Member.update(members[0].id, memberData);
        }).then(member => {
            logger.info('extending membership', { id: member.id });
            return Member.extendMembership(member, product).then(member => {
                logger.info('new end date', {expirationDate: member.expiration_date});
                return Payment.create({
                    member: member,
                    products: [product],
                }).then(() => {
                    logger.info('create confirmation mail');
                    let mail = {
                        sender: ewbMail.sender(),
                        recipient: memberData.email,
                        subject: ewbMail.getSubject('membership'),
                        body: ewbMail.getBody('membership', { expirationDate: moment(member.expiration_date).format('YYYY-MM-DD') }),
                    };

                    return OutgoingMessage.create(mail);
                });
            });
        }).then(() => {
            return Promise.resolve(product);
        });
    }).then(product => {
        logger.info('create receipt mail');
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

        return OutgoingMessage.create(receiptMail);
    }).then(() => {
        logger.info('all done');
        res.sendStatus(201);
    }).catch(err => {
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

    // Make sure that addonIds are integers
    req.body.addonIds = req.body.addonIds.map(addonId => {
        return parseInt(addonId, 10);
    }).filter(addonId => {
        return addonId;
    });

    Event.findWithAddons(req.body.identifier).then(event => {
        if (!event) {
            return res.sendStatus(404);
        }

        let selectedAddons = event.addons.filter(addon => { return req.body.addonIds.includes(addon.id); });
        let sum = selectedAddons.reduce((total, addon) => { return total + addon.price; }, 0);

        logger.info('initiating event payment', event);
        if (sum === 0 && req.body.stripeToken) {
            logger.error('sum shouldnt be 0 if there is a stripe token present', event, req.body.participant);

            let badRequest = new Error('Malformed parameters');
            badRequest.status = 400;
            return next(badRequest);
        } else if (sum === 0) {
            logger.info('free event');
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
                    logger.info('payment successful');
                    resolve(event);
                }, err => {
                    logger.info('payment failed');
                    let badRequest = new Error('Stripe rejected');
                    badRequest.status = 400;
                    reject(badRequest);
                });
            }).catch(err => {
                next(err);
            });
        }
    }).then(event => {
        logger.info('add participant');
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
        logger.info('create receipt mail');
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

        return OutgoingMessage.create(receiptMail).then(() => {
            return EmailTemplate.get(event.email_template_id);
        }).then(template => {
            logger.info('create event mail');
            let eventMail = {
                sender: ewbMail.noreply(),
                recipient: req.body.participant.email,
                subject: template.subject,
                body: template.body,
            };

            return OutgoingMessage.create(eventMail);
        });
    }).then(() => {
        logger.info('all done!');
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


/**
 * Payment controller
 *
 * @namespace controller.Payment
 * @memberOf controller
 */

'use strict';

const stripe = require('../../stripe');
const moment = require('moment');
const logger = require('../../config/logger');
const Event = require('../../models/event.model');
const Member = require('../../models/member.model');
const OutgoingMessage = require('../../models/outgoing-message.model');
const Payment = require('../../models/payment.model');
const Product = require('../../models/product.model');
const EmailTemplate = require('../../models/email-template.model');

const ewbMail = require('../../components/ewb-mail');

const { OutgoingMessage2 } = require('../outgoing-message/OutgoingMessage');
const outgoingMessageRepository = require('../outgoing-message/OutgoingMessageRepository');

/**
 * Get all payments
 *
 * @memberOf controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
function index(req, res, next) {
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
function get(req, res, next) {
    Payment.get(req.params.id).then(data => {
        res.status(200).json(data);
    }).catch(err => {
        next(err);
    });
};


/**
 * Confirm event paymenT
 *
 * @memberOf controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
function confirmEventPayment(req, res, next) {
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
                stripe.processCharge({
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
        const receiptMail = OutgoingMessage2.createReceipt(req.body.participant.email, [event.addons])
        outgoingMessageRepository.create(receiptMail)
            .then(() => {
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
 * Generate payment report
 *
 * @memberof controller.Payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express error function
 */
function generateReport(req, res, next) {
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


function stripeCheckoutKey(req, res) {
  const key = stripe.getCheckoutKey();
  return res.status(200).json({ key });
}

module.exports = {
  index,
  get,
  confirmEventPayment,
  stripeCheckoutKey,
  generateReport,
};

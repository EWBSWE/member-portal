'use strict';

var _ = require('lodash');

var stripe = require('stripe')('***REMOVED***');
if (process.env.NODE_ENV === 'production') {
    stripe = require('stripe')('sk_live_aRwKpgsqwq7rpsozBg43Clx5');
}

var moment = require('moment');
var mongoose = require('mongoose');

var Buyer = require('../../models/buyer.model');
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

exports.index = function(req, res) {
    Payment.find().populate({
        path: 'buyer',
    }).lean().exec(function (err, payments) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(payments);
    });
};

exports.show = function(req, res) {
    Payment.findOne({ _id: req.params.id }, function(err, payment) {
        if (err) {
            return handleError(res, err);
        } else {
            return res.status(200).json(payment);
        }
    });
};

exports.confirmMembershipPayment = function(req, res) {
    var stripeToken = req.body.stripeToken;

    function handlePayment(product, memberData) {
        processCharge({
            currency: 'SEK',
            amount: product.price,
            description: product.name,
        }, stripeToken, function() {
            return fetchOrCreateMember(product, memberData);
        }, function(err) {
            var error = handleStripeError(err);
            return res.status(400).json(error);
        });
    };

    function fetchOrCreateMember(product, memberData) {
        MemberHelper.fetchMember(memberData.email, function(err, maybeMember) {
            if (err) {
                return handleError(res, err);
            }
            if (maybeMember) {
                return updateMemberData(product, maybeMember, memberData);
            } else {
                // Member doesn't exist, we need to create the member before we
                // proceed
                MemberHelper.createMember(memberData, function(err, member) {
                    if (err) {
                        return handleError(res, err);
                    }

                    return createBuyer(product, member, true);
                });
            }
        });
    };

    function updateMemberData(product, member, memberData) {
        // If days remain on current membership we want to extend the
        // membership instead of overwriting it
        if (moment(member.expirationDate) > moment()) {
            // Default to 1 day
            var daysDiff = moment(member.expirationDate).diff(moment(), 'days') || 1;
            memberData.expirationDate.add(daysDiff, 'days');
        }

        MemberHelper.updateMember(member, memberData, function(err, updatedMember) {
            if (err) {
                return handleError(res, err);
            }

            return createBuyer(product, updatedMember, false);
        });
    };

    function createBuyer(product, member, newMember) {
        PaymentHelper.createBuyer('Member', member._id, function(err, buyer) {
            if (err) {
                return handleError(res, err);
            }

            return addPayment(product, member, newMember, buyer);
        });
    };

    function addPayment(product, member, newMember, buyer) {
        Payment.create({
            buyer: buyer._id,
            amount: product.price,
            products: [ product._id ],
        }, function(err, payment) {
            if (err) {
                return handleError(res, err);
            }

            return sendReceipt(product, member, newMember);
        });
    };

    function sendReceipt(product, member, newMember) {
        var receiptMail = {
            from: ewbMail.sender(),
            to: member.email,
            subject: ewbMail.getSubject('receipt', { name: product.name }),
            text: ewbMail.getBody('receipt', {
                buyer: member.email,
                date: moment().format('YYYY-MM-DD HH:mm'),
                total: PaymentHelper.formatTotal([product]),
                tax: PaymentHelper.formatTax([product]),
                list: PaymentHelper.formatProductList([product]),
            }),
        };

        OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
            if (err) {
                ewbError.create({ message: 'Membership receipt mail', origin: __filename, params: err });
            }

            return sendConfirmation(member, newMember);
        });
    }

    function sendConfirmation(member, newMember) {
        var confirmationMail = {
            from: ewbMail.sender(),
            to: req.body.email,
        };

        if (newMember) {
            confirmationMail.subject = ewbMail.getSubject('new-member');
            confirmationMail.text = ewbMail.getBody('new-member');
        } else {
            confirmationMail.subject = ewbMail.getSubject('renewal');
            confirmationMail.text = ewbMail.getBody('renewal');
        }

        OutgoingMessage.create(confirmationMail, function(err, outgoingMessage) {
            if (err) {
                ewbError.create({ message: 'Membership confirmation mail', origin: __filename, params: err });
            }
        });

        return res.status(201).json(member);
    };

    Product.findOne({ _id: new mongoose.Types.ObjectId(req.body.productId) }, function(err, product) {
        if (err) {
            return handleError(res, err);
        }

        if (product) {
            // Important to trim email since we use it for lookups
            var memberData = {
                email: req.body.email.trim(),
                name: req.body.name,
                location: req.body.location,
                profession: req.body.profession,
                education: req.body.education,
                type: req.body.type,
                gender: req.body.gender,
                yearOfBirth: req.body.yearOfBirth,
                expirationDate: moment().add(product.typeAttributes.durationDays, 'days'),
            };

            return handlePayment(product, memberData);
        } else {
            return res.sendStatus(400);
        }
    });

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
            ewbError.create({ message: 'Stripe process charge', origin: __filename, params: err });
            errorCallback(err);
        }
    });
};

function handleStripeError(err) {
    ewbError.create({ message: 'Stripe charge error', origin: __filename, params: err});

    return { errorType: err.type };
};

function handleError(res, err) {
    return res.status(500).send(err);
};

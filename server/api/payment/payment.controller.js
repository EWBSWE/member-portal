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
    Payment.find().populate('buyer').lean().exec(function (err, payments) {
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
                return updateMemberData(product, maybeMember);
            } else {
                // Member doesn't exist, we need to create the member before we
                // proceed
                MemberHelper.createMember(memberData, function(err, member) {
                    if (err) {
                        return handleError(res, err);
                    }

                    return fetchBuyer(product, member);
                });
            }
        });
    };

    function updateMemberData(product, member) {
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

            return fetchBuyer(product, updatedMember);
        });
    };

    function fetchBuyer(product, member) {
        PaymentHelper.fetchOrCreateBuyer('Member', member._id, function(err, buyer) {
            if (err) {
                return handleError(res, err);
            }

            return addPayment(product, member, buyer);
        });
    };

    function addPayment(product, member, buyer) {
        Payment.create({
            buyer: buyer._id,
            amount: product.price,
            products: [ product._id ],
        }, function(err, payment) {
            if (err) {
                return handleError(res, err);
            }

            return sendConfirmation(member);
        });
    };

    function sendConfirmation(member) {
        var receiptMail = {
            from: ewbMail.sender(),
            to: process.env.NODE_ENV === 'production' ? req.body.email : process.env.DEV_MAIL,
        };

        if (member.isNew) {
            receiptMail.subject = ewbMail.getSubject('new-member');
            receiptMail.text = ewbMail.getBody('new-member');
        } else {
            receiptMail.subject = ewbMail.getSubject('renewal');
            receiptMail.text = ewbMail.getBody('renewal');
        }

        OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
            if (err) {
                ewbError.create({ message: 'Membership receipt mail', origin: __filename, params: err });
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
    function processEventPayments(ewbEvent, email, selectedAddons) {
        var sum = EventHelper.sumAddons(selectedAddons);

        return processCharge({
            currency: 'SEK',
            amount: sum,
            description: ewbEvent.name,
        }, req.body.stripeToken, function(charge) {
            // Successful charge
            return findEventParticipant(ewbEvent, email, selectedAddons);
        }, function(stripeError) {
            // Failed charge
            var error = handleStripeError(stripeError);
            return res.status(400).json(error);
        });
    };

    function findEventParticipant(ewbEvent, email, selectedAddons) {
        EventHelper.fetchOrCreateEventParticipant(email, function(err, eventParticipant) {
            if (err) {
                ewbError.create({ message: 'Error fetching event participant', origin: __filename, params: err });
                return handleError(res, err);
            }

            return addPaymentToParticipant(ewbEvent, selectedAddons, eventParticipant);
        });
    };

    function addPaymentToParticipant(ewbEvent, selectedAddons, eventParticipant) {
        var sum = EventHelper.sumAddons(selectedAddons);
        var productIds = _.map(selectedAddons, function(a) {
            return a.product._id;
        });

        PaymentHelper.fetchOrCreateBuyer('EventParticipant', eventParticipant._id, function(err, buyer) {
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

                return updateEventParticipant(ewbEvent, selectedAddons, eventParticipant, payment);
            });
        });
    };

    function updateEventParticipant(ewbEvent, selectedAddons, eventParticipant, payment) {
        eventParticipant.payments.push(payment);

        eventParticipant.save(function(err, updatedParticipant) {
            if (err) {
                ewbError.create({ message: 'Failed to update event participant', origin: __filename, params: err });
                return handleError(res, err);
            }

            return addToEvent(ewbEvent, selectedAddons, updatedParticipant);
        });
    };

    function addToEvent(ewbEvent, selectedAddons, eventParticipant) {
        return EventHelper.addParticipantToEvent(ewbEvent, eventParticipant, function(err, result) {
            if (err) {
                ewbError.create({ message: 'Failed to add participant to event', origin: __filename, params: err });
                return handleError(res, err);
            }

            return updateEventAddons(ewbEvent, selectedAddons, eventParticipant);
        });
    };

    function updateEventAddons(ewbEvent, selectedAddons, eventParticipant) {
        var addonIds = _.map(selectedAddons, '_id');

        EventHelper.updateAddons(addonIds, function(err, updatedAddons) {
            if (err) {
                ewbError.create({ message: 'Failed to update event addon', origin: __filename, params: err });
                return handleError(res, err);
            }

            return sendConfirmationEmail(ewbEvent, eventParticipant);
        });
    };

    function sendConfirmationEmail(ewbEvent, eventParticipant) {
        var receiptMail = {
            from: ewbMail.sender(),
            to: process.env.NODE_ENV === 'production' ? eventParticipant.email : process.env.DEV_MAIL,
            subject: ewbEvent.confirmationEmail.subject,
            text: ewbEvent.confirmationEmail.body,
        };

        OutgoingMessage.create(receiptMail, function(err, outgoingMessage) {
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
            return findEventParticipant(ewbEvent, req.body.email, selectedAddons);
        } else {
            return processEventPayments(ewbEvent, req.body.email, selectedAddons);
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
    // TODO translate
    var errorMessage = 'Vi misslyckades med att genomföra din betalning.';

    ewbError.create({ message: 'Stripe charge error', origin: __filename, params: err});

    if (err.type === 'StripeCardError') {
        // TODO Translate
        errorMessage = 'Ditt kort medges ej. Ingen betalning genomförd.';
    } else if (err.type === 'RateLimitError') {
        // Too many requests made to the API too quickly
    } else if (err.type === 'StripeInvalidError') {
        // Invalid parameters were supplied to Stripe's API
    } else if (err.type === 'StripeAPIError') {
        // An error occurred internally with Stripe's API
    } else if (err.type === 'StripeConnectionError') {
        // Some kind of error occurred during the HTTPS communication
    } else if (err.type === 'StripeAuthenticationError') {
        // Probably used incorrect API key
    }

    return { message: errorMessage };
};

function handleError(res, err) {
    return res.status(500).send(err);
};

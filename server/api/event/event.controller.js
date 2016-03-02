'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');

var Event = require('../../models/event.model');
var EventAddon = require('../../models/event-addon.model');
var EventParticipant = require('../../models/event-participant.model');
var Product = require('../../models/product.model');
var ProductType = require('../../models/product-type.model');

var EventHelper = require('./event.helper');

exports.index = function (req, res) {
    return Event.find().exec(function(err, events) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(200).json(events);
    });
};

exports.showPublic = function(req, res) {
    return Event.findOne({
        identifier: req.query.url,
        active: true
    }).populate({
        path: 'addons',
        populate: {
            path: 'product',
        },
    }).lean().exec(function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        if (!ewbEvent) {
            return res.sendStatus(404);
        }

        ewbEvent.remaining = ewbEvent.maxParticipants - ewbEvent.participants.length;

        // Don't send list of participant ids
        delete ewbEvent.participants;

        return res.status(200).json(ewbEvent);
    });
}

exports.show = function (req, res) {
    Event.findById(req.params.id).populate({
        path: 'addons',
        populate: {
            path: 'product',
        },
    }).lean().exec(function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        if (!ewbEvent) {
            return res.sendStatus(404);
        }

        return res.status(200).json(ewbEvent);
    });
};

exports.create = function (req, res) {
    var eventData = {
        name: req.body.name,
        identifier: req.body.identifier,
        description: req.body.description,
        active: req.body.active == 1,
        contact: req.body.contact,
        dueDate: req.body.dueDate,
    };

    function createEvent(eventData, productType, addonData) {
        Event.create(eventData, function(err, ewbEvent) {
            if (err) {
                return handleError(res, err);
            }

            return createProducts(ewbEvent, productType, addonData);
        });
    };

    function createProducts(ewbEvent, productType, addonData) {
        var products = _.map(addons, function(addon) {
            return {
                name: addon.name,
                price: addon.price,
                type: productType._id,
            };
        });

        Product.create(products, function(err, newProducts) {
            if (err) {
                return handleError(res, err);
            }

            return createAddons(ewbEvent, addons, newProducts);
        });
    };

    function createAddons(ewbEvent, addons, products) {
        for (var i = 0; i < addons.length; i++) {
            addons[i].product = products[i]._id;
        }

        EventAddon.create(addons, function(err, addons) {
            if (err) {
                return handleError(res, err);
            }

            ewbEvent.addons = addons;
            ewbEvent.save(function(err, updatedEwbEvent) {
                if (err) {
                    return handleError(res, err);
                }

                return res.status(201).json(ewbEvent);

            });
        });
    };

    ProductType.findOne({ identifier: 'Event' }, function(err, productType) {
        if (err) {
            return handleError(res, err);
        }

        return createEvent(eventData, productType, req.body.addons);
    });
};

exports.update = function (req, res) {
    var eventData = {
        _id: req.params.id,
        name: req.body.name,
        identifier: req.body.identifier,
        description: req.body.description,
        active: req.body.active == 1,
        contact: req.body.contact,
        dueDate: req.body.dueDate,
    };

    var addonData = _.map(req.body.addons, function(addon) {
        return {
            _id: addon._id,
            capacity: addon.capacity,
            name: addon.name,
            price: addon.price,
        };
    });

    function determineChangeInProducts(ewbEvent, data) {
        if (data.length === ewbEvent.addons.length) {
            return fetchProducts(ewbEvent, data, _.map(ewbEvent.addons, 'product'));
        } else if (data.length < ewbEvent.addons.length) {
            var addonsToUpdate = [];
            var addonsToRemove = [];

            for (var i = 0; i < ewbEvent.addons.length; i++) {
                if (i < data.length) {
                    addonsToUpdate.push(ewbEvent.addons[i]);
                } else {
                    addonsToRemove.push(ewbEvent.addons[i]);
                }
            }

            EventHelper.removeAddons(addonsToRemove, function(err, result) {
                if (err) {
                    return handleError(res, err);
                }

                return fetchProducts(ewbEvent, data, _.map(addonsToUpdate, 'product'));
            });
        } else if (data.length > ewbEvent.addons.length) {
            var addonsToCreate = [];
            var addonsToUpdate = [];
            for (var i = 0; i < data.length; i++) {
                if (data[i]._id) {
                    addonsToUpdate.push(data[i]);
                } else {
                    addonsToCreate.push(data[i]);
                }
            }

            EventHelper.createAddons(ewbEvent, addonsToCreate, function(err, newAddons) {
                if (err) {
                    return handleError(res, err);
                }

                return fetchProducts(ewbEvent, data, _.map(addonsToUpdate, 'product'));
            });
        }
    };

    function fetchProducts(ewbEvent, data, productIds) {
        Product.find({
            _id: {
                $in: productIds,
            }
        }, function(err, products) {
            if (err) {
                return handleError(res, err);
            }

            return updateProducts(ewbEvent, data, products);
        });
    };

    function updateProducts(ewbEvent, data, products) {
        function recursiveSaveProduct(index) {
            if (index < products.length) {
                var product = products[index];
                var productData = data[index];

                Product.update({
                    _id: product._id,
                }, {
                    name: productData.name,
                    price: productData.price,
                }, function(err, result) {
                    if (err) {
                        return handleError(res, err);
                    }

                    return recursiveSaveProduct(index + 1);
                });
            } else {
                return fetchAddons(ewbEvent, data);
            }
        };

        // Pass starting index
        recursiveSaveProduct(0);
    };

    function fetchAddons(ewbEvent, data) {
        EventAddon.find({
            _id: {
                $in: _.map(ewbEvent.addons, '_id'),
            },
        }, function(err, addons) {
            if (err) {
                return handleError(res, err);
            }

            return updateAddons(ewbEvent, data, addons);
        });
    };

    function updateAddons(ewbEvent, data, addons) {
        function recursiveSaveAddons(index) {
            if (index < addons.length) {
                var addon = addons[index];
                var addonData = data[index];

                EventAddon.update({
                    _id: addon._id,
                }, {
                    capacity: addonData.capacity,
                }, function(err, results) {
                    if (err) {
                        return handleError(res, err);
                    }

                    return recursiveSaveAddons(index + 1);
                });
            } else {
                return res.status(202).json(ewbEvent);
            }
        };

        recursiveSaveAddons(0);
    };

    Event.findOne({
        _id: eventData._id
    }).populate({
        path: 'addons',
        populate: {
            path: 'product',
        },
    }).exec(function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }

        if (!ewbEvent) {
            return res.sendStatus(404);
        }

        ewbEvent.name = eventData.name;
        ewbEvent.identifier = eventData.identifier;
        ewbEvent.description = eventData.description;
        ewbEvent.active = req.body.active == 1;
        ewbEvent.contact = req.body.contact;
        ewbEvent.dueDate = req.body.dueDate;

        ewbEvent.save(function(err, updatedEvent) {
            if (err) {
                return handleError(res, err);
            }

            //return res.status(202).json(ewbEvent);
            return determineChangeInProducts(updatedEvent, addonData)
        });
    });
};

exports.updateAddon = function(req, res) {
    function updateProduct(addon, data) {
        Product.update({
            _id: addon.product,
        }, data, function(err, result) {
            if (err) {
                return handleError(res, err);
            }

            return res.status(202).json(result);
        });
    };

    EventAddon.findOne({ _id: req.params.addonId }, function(err, addon) {
        if (err) {
            return handleError(res, err);
        }

        if (!addon) {
            return res.sendStatus(404);
        }

        addon.capacity = req.body.capacity;

        addon.save(function(err, updatedAddon) {
            updateProduct(updatedAddon, {
                name: req.body.name,
                price: req.body.price,
            });
        });
    });
};

exports.addParticipant = function (req, res) {
    Event.findById(req.params.id, function (err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }
        if (!ewbEvent) {
            return res.sendStatus(404);
        } else {
            EventHelper.addParticipant(ewbEvent, req.body.email, function (err, result) {
                if (err) {
                    return handleError(res, err);
                }

                return res.status(200).json(result);
            });
        }
    });
};

exports.destroy = function (req, res) {
    Event.findById(req.params.id, function(err, ewbEvent) {
        if (err) {
            return handleError(res, err);
        }
        if (!ewbEvent) {
            return res.sendStatus(404);
        }

        ewbEvent.remove(function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.sendStatus(204);
        });
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
};


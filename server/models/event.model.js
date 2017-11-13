/**
 * Event model
 *
 * @namespace model.Event
 * @memberOf model
 */

'use strict';

var db = require('../db').db;

var EmailTemplate = require('./email-template.model');
var Member = require('./member.model');
var Product = require('./product.model');
var ProductType = require('./product-type.model');

var postgresHelper = require('../helpers/postgres.helper');

const COLUMN_MAP = {
    name: 'name',
    description: 'description',
    identifier: 'identifier',
    active: 'active',
    dueDate: 'due_date',
    emailTemplateId: 'email_template_id',
    notificationOpen: 'notification_open',
};

/**
 * Fetch all events
 *
 * @memberOf model.Event
 * @returns {Promise<Array|Error>} Resolves to an array of events
 */
function index() {
    return db.any(`
        SELECT
            id,
            name,
            identifier,
            active,
            created_at,
            updated_at,
            due_date,
            notification_open,
            count(member_id) AS participants
        FROM event
        LEFT JOIN event_participant ON event.id = event_id
        GROUP BY id
        ORDER BY id
    `);
}

function create(data) {
    let templateId;
    let productIds;
    let members = [];

    if (!Array.isArray(data.subscribers)) {
        const invalidSubscribersError = new Error('Invalid subscribers');
        invalidSubscribersError.status = 400;
        invalidSubscribersError.invalidSubscribers = true;
        return Promise.reject(invalidSubscribersError);
    }

    return new Promise((resolve, reject) => {
        if (data.subscribers.length === 0) {
            resolve();
        } else {
            Member.findBy({ email: data.subscribers }).then(ms => {
                if (ms.length !== data.subscribers.length) {
                    const invalidSubscribersError = new Error('Invalid subscribers');
                    invalidSubscribersError.status = 400;
                    invalidSubscribersError.invalidSubscribers = true;
                    reject(invalidSubscribersError);
                } else {
                    members = ms;
                    resolve();
                }
            });
        }
    }).then(() => {
        return EmailTemplate.create(data.emailTemplate);
    }).then(template => {
        templateId = template.id;

        return ProductType.find(ProductType.EVENT);
    }).then(pt => {
        data.addons.forEach(addon => { addon.productTypeId = pt.id });

        return Product.create(data.addons);
    }).then(products => {
        // Update data.addons with correct product_id
        for (var i = 0; i < data.addons.length; i++) {
            data.addons[i].productId = products[i].id;
        }

        data.emailTemplateId = templateId;

        return db.one(`
            INSERT INTO event (
                name,
                description,
                identifier,
                active,
                due_date,
                email_template_id,
                notification_open
            ) VALUES (
                $[name],
                $[description],
                $[identifier],
                $[active],
                $[dueDate],
                $[emailTemplateId],
                $[notificationOpen]
            ) RETURNING id, identifier, email_template_id
        `, data);
    }).then(event => {
        return db.tx(transaction => {
            let addonQueries = data.addons.map(addon => {
                return transaction.one(`
                    INSERT INTO event_product (event_id, capacity, product_id)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `, [event.id, addon.capacity, addon.productId]);
            });

            let subscriberQueries = members.map(m => {
                return transaction.one(`
                    INSERT INTO event_subscriber (event_id, member_id)
                    VALUES ($1, $2)
                    RETURNING *
                `, [event.id, m.id]);
            });

            let queries = addonQueries.concat(subscriberQueries);

            return transaction.batch(queries);
        }).then(() => {
            return Promise.resolve(event);
        });
    });
}

function addParticipant(eventId, participant) {
    return Member.find(participant.email).then(maybeMember => {
        if (maybeMember === null) {
            return Member.create(participant);
        }

        return Promise.resolve(maybeMember);
    }).then(member => {
        return db.tx(transaction => {
            return transaction.batch([
                transaction.many(`
                    UPDATE event_product
                    SET capacity = (capacity - 1)
                    WHERE event_id = $1 AND id IN ($2:csv) AND capacity > 0
                    RETURNING *
                `, [eventId, participant.addonIds]),
                transaction.one(`
                    INSERT INTO event_participant (event_id, member_id)
                    VALUES ($1, $2)
                    RETURNING member_id
                `, [eventId, member.id]),
                transaction.one(`
                    INSERT INTO payment (member_id, amount)
                    VALUES ($1, (
                        SELECT SUM(price)
                        FROM event
                        LEFT JOIN event_product ON (event.id = event_product.event_id)
                        LEFT JOIN product ON (event_product.product_id = product.id)
                        WHERE event.id = $2 AND event_product.id IN ($3:csv)
                        )
                    )
                    RETURNING id
                `, [member.id, eventId, participant.addonIds])
            ]);
        });
    }).then(transactionResult => {
        let payment = transactionResult[2];

        return db.none(`
            INSERT INTO event_payment (event_id, payment_id, message)
            VALUES ($1, $2, $3)
        `, [eventId, payment.id, participant.message]).then(() => {
            return db.tx(transaction => {
                let queries = participant.addonIds.map(a => {
                    return transaction.none(`
                        INSERT INTO payment_product (payment_id, product_id)
                        VALUES ($1, (
                            SELECT product_id FROM event_product WHERE id = $2
                        ))
                    `, [payment.id, a]);
                });

                return transaction.batch(queries);
            });
        });
    });
}

function findBy(data) {
    let wheres = postgresHelper.where(COLUMN_MAP, data);

    return db.any(`
        SELECT
            event.id,
            event.email_template_id,
            event.identifier,
            event.name,
            array_agg(event_product.id) AS addons
        FROM event
        LEFT JOIN event_product ON (event.id = event_product.event_id)
        WHERE ${wheres.clause}
        GROUP BY event.id
    `, wheres.data);
}

function findWithAddons(identifier) {
    return findBy({ identifier: identifier }).then(events => {
        if (events.length === 0) {
            return Promise.resolve(null);
        }

        return db.any(`
            SELECT
                event_product.id,
                name,
                capacity,
                price,
                description,
                attribute,
                currency_code
            FROM event_product
            LEFT JOIN product ON (event_product.product_id = product.id)
            WHERE event_id = $1
        `, events[0].id).then(addons => {
            // Parse the price and capacity of each addon as an integer
            addons.forEach(addon => {
                addon.capacity = +addon.capacity;
                addon.price = +addon.price;
            });

            events[0].addons = addons;

            return Promise.resolve(events[0]);
        });
    });
}

/**
 * Get event
 *
 * @memberOf model.Event
 * @param {Number} id - Id of event
 * @returns {Promise<Object|Error>} Resolves to an event object
 */
function get(id) {
    return db.oneOrNone(`
        SELECT
            id,
            identifier,
            name,
            description,
            created_at,
            due_date,
            notification_open,
            active,
            email_template_id
        FROM event
        WHERE event.id = $1
    `, id).then(e => {
        if (e === null) {
            return null;
        }

        return db.task(t => {
            return t.batch([
                t.many(`
                    SELECT event_product.id, product_id, product.name, product.price, capacity, product.description
                    FROM event_product
                    JOIN product ON product.id = event_product.product_id
                    WHERE event_id = $1
                    ORDER BY product.id
                `, id),
                t.any(`
                    SELECT name, email
                    FROM event_participant
                    JOIN member ON member.id = member_id
                    WHERE event_id = $1
                `, id),
                t.any(`
                    SELECT email
                    FROM member
                    JOIN event_subscriber ON member.id = event_subscriber.member_id
                    WHERE event_id = $1
                `, id),
                t.any(`
                    SELECT event_payment.payment_id, name, email, amount, message, array_agg(payment_product.product_id) AS addons
                    FROM event_payment
                    JOIN payment ON event_payment.payment_id = payment.id
                    JOIN member ON payment.member_id = member.id
                    JOIN payment_product ON payment.id = payment_product.payment_id
                    WHERE event_id = $1
                    GROUP BY event_payment.payment_id, name, email, amount, message
                `, id),
                t.one(`
                    SELECT subject, body
                    FROM email_template
                    WHERE id = $1
                `, e.email_template_id),
            ]);
        }).spread((addons, participants, subscribers, payments, emailTemplate) => {
            e.addons = addons;
            e.participants = participants;
            e.subscribers = subscribers;
            e.payments = payments;
            e.emailTemplate = emailTemplate;

            return Promise.resolve(e);
        });
    });
}

/**
 * Destroy event
 *
 * @memberOf model.Event
 * @param {Number} id - Id of event
 * @returns {Promise<Undefined|Error>} Resolves to undefined
 */
function destroy(id) {
    return db.none(`DELETE FROM event WHERE id = $1`, id);
}

/**
 * Update event
 *
 * @memberOf model.Event
 * @param {Number} id - Id of event
 * @param {Object} data - Object with new attributes
 * @returns {Promise<Object|Error>} Resolves to new object
 */
function update(id, data) {
    let mapped = postgresHelper.update(COLUMN_MAP, data);

    if (mapped === null) {
        return Promise.reject('No attributes to update');
    }

    return db.one(`
        UPDATE event
        SET ${mapped}
        WHERE id = $[id]
        RETURNING *
    `, Object.assign(data, {id: id})).then(e => {
        if (data.emailTemplate) {
            return EmailTemplate.update(e.email_template_id, data.emailTemplate).then(() => {
                return Promise.resolve(e);
            });
        }

        return Promise.resolve(e);
    });
}

module.exports = {
    index: index,
    create: create,
    get: get,
    destroy: destroy,
    addParticipant: addParticipant,
    findBy: findBy,
    findWithAddons: findWithAddons,
    update: update,
};

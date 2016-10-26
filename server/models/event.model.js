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
            notification_open
        FROM event
        ORDER BY id
    `);
}

function create(attributes) {
    let templateId;
    let productIds;

    return new Promise((resolve, reject) => {
        if (!attributes.emailTemplateId) {
            return EmailTemplate.create(attributes.emailTemplate).then(template => {
                resolve(template);
            }).catch(err => {
                reject(err);
            });
        }

        return resolve({ id: attributes.emailTemplateId });
    }).then(template => {
        templateId = template.id;

        attributes.addons.forEach(addon => { addon.productType = 'Event' });

        return new Promise((resolve, reject) => {
            if (!attributes.productIds) {
                return Product.create(attributes.addons).then(products => {
                    resolve(products);
                }).catch(err => {
                    reject(err);
                });
            }

            return resolve(attributes.productIds);
        });
    }).then(products => {
        // Update attributes.addons with correct product_id
        for (var i = 0; i < attributes.addons.length; i++) {
            attributes.addons[i].productId = products[i].id;
        }

        attributes.emailTemplateId = templateId;

        return db.one(`
            INSERT INTO event (
                name,
                identifier,
                active,
                due_date,
                email_template_id,
                notification_open
            ) VALUES (
                $[name],
                $[identifier],
                $[active],
                $[dueDate],
                $[emailTemplateId],
                $[notificationOpen]
            ) RETURNING id, identifier
        `, attributes);
    }).then(event => {
        return db.tx(transaction => {
            let queries = attributes.addons.map(addon => {
                return transaction.one(`
                    INSERT INTO event_addon (event_id, capacity, product_id)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `, [event.id, addon.capacity, addon.productId]);
            });
            return transaction.batch(queries);
        }).then(addons => {
            return Promise.resolve(event);
        });
    });
}

function addParticipant(event, participant) {
    return Member.find(participant.email).then(maybeMember => {
        if (!maybeMember) {
            return Member.create(participant);
        }

        return Promise.resolve(maybeMember);
    }).then(member => {
        return db.tx(transaction => {
            return transaction.batch([
                db.one(`
                    UPDATE event_addon
                    SET capacity = (capacity - 1)
                    WHERE id IN ($1)
                    RETURNING id
                `, participant.addonIds),

                db.one(`
                    INSERT INTO event_participant (
                        event_id,
                        member_id,
                        message
                    ) VALUES ($1, $2, $3)
                    RETURNING member_id
                `, [event.id, member.id, participant.message]),

                db.one(`
                    INSERT INTO payment (member_id, amount)
                    VALUES ($1, (
                        SELECT SUM(price)
                        FROM event
                        LEFT JOIN event_addon ON (event.id = event_addon.event_id)
                        LEFT JOIN product ON (event_addon.product_id = product.id)
                        WHERE event_addon.id IN ($2:csv)
                        )
                    )
                    RETURNING id
                `, [member.id, participant.addonIds])
            ]);
        });
    }).then(transactionResult => {
        let payment = transactionResult[2];
        return db.none(`
            INSERT INTO event_payment (event_id, payment_id)
            VALUES ($1, $2)
        `, [event.id, payment.id]);
    });
}

function find(identifier) {
    return db.oneOrNone(`
        SELECT
            event.id,
            event.email_template_id,
            event.identifier,
            event.name,
            array_agg(event_addon.id) AS addons
        FROM event
        LEFT JOIN event_addon ON (event.id = event_addon.event_id)
        WHERE event.identifier = $1
        GROUP BY event.id
    `, identifier);
}

function findWithAddons(identifier) {
    return find(identifier).then(event => {
        return db.any(`
            SELECT
                event_addon.id,
                name,
                price,
                description,
                attribute,
                currency_code
            FROM event_addon
            LEFT JOIN product ON (event_addon.product_id = product.id)
        `).then(addons => {
            // Parse the price of each addon as an integer
            addons.forEach(addon => { addon.price = +addon.price });

            event.addons = addons;

            return Promise.resolve(event);
        });
    });
}

module.exports = {
    index: index,
    create: create,
    addParticipant: addParticipant,
    find: find,
    findWithAddons: findWithAddons,
};

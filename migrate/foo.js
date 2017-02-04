'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const parse = require('csv-parse');
const Promise = require('bluebird');

const db = require(path.join(__dirname, '../server/db')).db;

// MODELS
const Member = require(path.join(__dirname, '../server/models/member.model'));

const inputFiles = {
    buyers: 'csv/buyers.csv',
    eventAddons: 'csv/eventaddons.csv',
    eventParticipants: 'csv/eventparticipants.csv',
    events: 'csv/events.csv',
    members: 'csv/members.csv',
    payments: 'csv/payments.csv',
    products: 'csv/products.csv',
    producttypes: 'csv/producttypes.csv',
    settings: 'csv/settings.csv',
    users: 'csv/users.csv',
};

function main() {
    let data = {};

    let files = Object.keys(inputFiles).map(key => {
        let raw = fs.readFileSync(inputFiles[key], 'utf8');

        return new Promise((resolve, reject) => {
            parse(raw, {columns: true}, function(err, data) {
                if (err) {
                    reject();
                }

                console.log(key, data.length);

                resolve({ key, data });
            });
        });
    });

    return Promise.all(files).then(result => {
        result.forEach(r => {
            data[r.key] = r.data;
        });
    }).then(() => {
        return insertUsers(data.users);
    }).then(() => {
        return insertMembers(data.members, data.eventParticipants);
    }).then(() => {
        return insertProductTypes(data.producttypes);
    }).then(() => {
        return insertProducts(data.products);
    }).then(() => {
        return insertEvents(data.events, data.eventParticipants);
    }).then(() => {
        return insertEventAddons(data.eventAddons, data.events);
    }).then(() => {
        return insertSettings(data.settings);
    }).then(() => {
        return insertPayments(data.payments, data.buyers, data.eventParticipants, data.events);
    }).then(() => {
        console.log('All is well in Middle-earth.');

        return Promise.resolve();
    }).catch(err => {
        console.log(err);
        return Promise.reject();
    });
}

function insertUsers(data) {
    console.log('INSERTING USERS');
    return db.task(tx => {
        let queries = data.map(d => {
            return tx.none(`
                INSERT INTO member (email, role, mongo_id)
                VALUES ($1, $2, $3)
            `, [d.email, d.role, d._id])
        });

        return tx.batch(queries);
    });
}

function insertMembers(data, eventParticipants) {
    console.log('INSERTING MEMBERS');

    return db.any(`SELECT * FROM member_type`).then(mts => {
        let mappedMemberTypes = {};

        mts.forEach(mt => {
            mappedMemberTypes[mt.member_type] = mt.id;
        });

        data.forEach(d => {
            d.member_type_id = mappedMemberTypes[d.type] || mappedMemberTypes.working;
            d.yearOfBirth = parseInt(d.yearOfBirth) || null;
            d.gender = d.gender || 'other';
            d.createdAt = moment(d.createdAt).toDate();
            d.expirationDate = moment(d.expirationDate).toDate();
        });

        return db.any(`SELECT * FROM member`);
    }).then(members => {
        // REMOVE EXISTING MEMBERS AND UPDATE THEM INSTEAD
        let existingEmails = members.map(m => { return m.email; });

        let toCreate = data.filter(d => {
            return !existingEmails.includes(d.email);
        });

        let toUpdate = data.filter(d => {
            return existingEmails.includes(d.email);
        });

        return db.task(tx => {
            let queries = toUpdate.map(m => {
                return tx.none(`
                    UPDATE member
                    SET
                        name = $[name],
                        location = $[location],
                        education = $[education],
                        profession = $[profession],
                        member_type_id = $[member_type_id],
                        year_of_birth = $[yearOfBirth],
                        created_at = $[createdAt],
                        expiration_date = $[expirationDate],
                        mongo_id = $[_id]
                    WHERE email = $[email]
                `, m);
            });

            return tx.batch(queries);
        }).then(() => {
            return db.task(tx => {
                let queries = toCreate.map(m => {
                    return tx.none(`
                        INSERT INTO member (
                            name,
                            location,
                            education,
                            profession,
                            email,
                            member_type_id,
                            gender,
                            year_of_birth,
                            created_at,
                            expiration_date,
                            mongo_id
                        ) VALUES (
                            $[name],
                            $[location],
                            $[education],
                            $[profession],
                            $[email],
                            $[member_type_id],
                            $[gender],
                            $[yearOfBirth],
                            $[createdAt],
                            $[expirationDate],
                            $[_id]
                        )
                    `, m);
                });

                return tx.batch(queries);
            });
        });
    }).then(() => {
        return db.any(`SELECT * FROM member`);
    }).then(members => {
        // Find event participants that are not yet put in the database
        let maybeMembers = eventParticipants.filter(p => {
            if (!p.eventId) {
                return false;
            }

            // If we have no record of p.email then we want to insert that
            // participant
            let matchingMembers = members.filter(m => {
                return m.email === p.email;
            });

            return matchingMembers.length === 0;
        });

        // I DON'T KNOW WHAT HAPPENED HERE. I FORGOT JAVASCRIPT FOR A SHORT
        // MOMENT. Was trying to remove "almost duplicate" members. That is
        // objects that are equal on some attribute are deemed duplicate.
        let asd = {};
        maybeMembers.forEach(m => {
            if (!asd[m.email]) {
                asd[m.email] = m;
            }
        });
        maybeMembers = Object.keys(asd).map(k => { return asd[k]; });


        return db.task(tx => {
            let queries = maybeMembers.map(m => {
                return tx.none(`
                    INSERT INTO member (
                        name,
                        email,
                        mongo_id
                    ) VALUES (
                        $[name],
                        $[email],
                        $[_id]
                    )
                `, m);
            });

            return tx.batch(queries);
        });
    });
}

function insertProductTypes(data) {
    console.log('INSERTING PRODUCT TYPES');

    return db.task(tx => {
        let queries = data.map(d => {
            return tx.any(`
                INSERT INTO product_type (identifier, mongo_id)
                VALUES ($[identifier], $[_id])
            `, d);
        });

        return tx.batch(queries);
    });
}

function insertProducts(data) {
    console.log('INSERTING PRODUCTS');

    return db.any('SELECT * FROM product_type').then(pts => {
        let mongoPsqlMap = {};
        pts.forEach(pt => {
            mongoPsqlMap[pt.mongo_id] = pt.id;
        });

        data.forEach(d => {
            if (d.typeAttributes.length) {
                d.attribute = JSON.parse(d.typeAttributes.replace(/""/g, '"')
                    .replace(/^"/, '').replace(/"$/, ''));
            } else {
                d.attribute = null;
            }

            d.price = parseInt(d.price);
            d.createdAt = moment(d.createdAt).toDate();
            d.updatedAt = moment(d.createdAt).toDate();
            d.product_type_id = mongoPsqlMap[d.type];
        });

        return db.task(tx => {
            let queries = data.map(d => {
                return tx.any(`
                    INSERT INTO product (
                        product_type_id,
                        name,
                        price,
                        description,
                        attribute,
                        created_at,
                        updated_at,
                        mongo_id
                    ) VALUES (
                        $[product_type_id],
                        $[name],
                        $[price],
                        $[description],
                        $[attribute],
                        $[createdAt],
                        $[updatedAt],
                        $[_id]
                    )
                `, d);
            });

            return tx.batch(queries);
        });
    });
}

function insertPayments(data, buyers, eventParticipants, events) {
    console.log('INSERTING PAYMENTS');

    events.forEach(e => {
        e.payments = JSON.parse(e.payments).map(p => {
            return `ObjectId(${p.$oid})`;
        });
    });

    return db.any('SELECT * FROM member').then(members => {
        let buyerMemberMap = {};
        let eventParticipantMemberMap = {};
        let undefinedMembers = 0;

        eventParticipants.forEach(p => {
            members.forEach(m => {
                if (p.email === m.email) {
                    eventParticipantMemberMap[p._id] = m.mongo_id;
                }
            });
        });

        buyers.forEach(b => {
            if (b.type === 'Member') {
                buyerMemberMap[b._id] = b.document;
            } else if (b.type === 'EventParticipant'){
                // This now references the correct member. That is a buyer
                // points to a member.
                buyerMemberMap[b._id] = eventParticipantMemberMap[b.document];
            }
        });

        data.forEach(d => {
            d.createdAt = moment(d.createdAt).toDate();

            let member = members.filter(m => {
                return buyerMemberMap[d.buyer] === m.mongo_id;
            })[0];

            // Member is undefined when a buyer is an EventParticipant and also
            // an existing member
            if (member === undefined) {
                undefinedMembers = undefinedMembers + 1;
            } else {
                d.member_id = member.id;
            }
        });

        console.log('Undefined members (should be 1): ', undefinedMembers);

        // Remove payments that lack a member
        let validPayments = data.filter(d => {
            return d.member_id;
        });

        return db.task(tx => {
            let queries = validPayments.map(d => {
                return tx.any(`
                    INSERT INTO payment (member_id, amount, created_at, mongo_id)
                    VALUES ($[member_id], $[amount], $[createdAt], $[_id])
                `, d);
            });

            return tx.batch(queries);
        });
    }).then(() => {
        return db.any('SELECT * FROM product').then(products => {
            return db.any('SELECT * FROM payment').then(payments => {
                return Promise.resolve([products, payments]);
            });
        });
    }).then(([products, payments]) => {
        data.forEach(d => {
            let payment = payments.filter(p => {
                return d._id === p.mongo_id;
            })[0];

            if (!d.products) {
                d.product_ids = [];
                return false;
            }

            d.payment_id = payment.id;
        });

        data.forEach(d => {
            // There is one payment that is not linked to any products.
            // Will adjust that manually once migration is complete.
            if (!d.products) {
                return false;
            } else {
                d.product_ids = products.filter(p => {
                    let mongoProducts = JSON.parse(d.products).map(mp => {
                        return `ObjectId(${mp.$oid})`;
                    });
                    return mongoProducts.includes(p.mongo_id);
                });
            }
        });

        return db.task(tx => {
            let queries = [];

            data.forEach(d => {
                d.product_ids.forEach(p => {
                    queries.push(tx.none(`
                        INSERT INTO payment_product (
                            payment_id,
                            product_id
                        ) VALUES (
                            $1,
                            $2
                        )
                    `, [d.payment_id, p.id]));
                });
            });

            return tx.batch(queries);
        }).then(() => {
            events.forEach(e => {
                e.payment_ids = e.payments.map(p => {
                    let id = payments.filter(pp => {
                        return p === pp.mongo_id;
                    })[0].id;

                    return id;
                });
            });

            return db.task(tx => {
                let queries = [];

                events.forEach(e => {
                    e.payment_ids.forEach(p => {
                        queries.push(tx.none(`
                            INSERT INTO event_payment (
                                event_id,
                                payment_id
                            ) VALUES (
                                $1,
                                $2
                            )
                        `, [e.id, p]));
                    });
                });

                return tx.batch(queries);
            });
        });
    });
}

function insertSettings(newSettings) {
    console.log('INSERTING SETTINGS');

    return db.task(tx => {
        let queries = newSettings.map(s => {
            return tx.none(`
                INSERT INTO setting (key, value, description)
                VALUES ($[key], $[value], $[description])
            `, s);
        });

        return tx.batch(queries);
    });
}

function insertEvents(newEvents, eventParticipants) {
    console.log('INSERTING EVENTS');

    newEvents.forEach(e => {
        e.email_template_id = null;
        e.created_at = moment(e.createdAt).toDate();
        e.updated_at = moment(e.updatedAt).toDate();
        e.due_date = moment(e.dueDate).toDate();
        e.notification_open = e.notificationOpen;
        e.subscribers = JSON.parse(e.subscribers);
        e.participants = JSON.parse(e.participants);
    });

    return db.task(tx => {
        let queries = newEvents.map(e => {
            return tx.one(`
                INSERT INTO event (
                    name,
                    identifier,
                    active,
                    created_at,
                    updated_at,
                    due_date,
                    email_template_id,
                    notification_open,
                    description,
                    mongo_id
                ) VALUES (
                    $[name],
                    $[identifier],
                    $[active],
                    $[created_at],
                    $[updated_at],
                    $[due_date],
                    $[email_template_id],
                    $[notification_open],
                    $[description],
                    $[_id]
                ) RETURNING id, mongo_id
            `, e);
        });

        return tx.batch(queries);
    }).then(eventIds => {
        newEvents.forEach(e => {
            e.id = eventIds.filter(f => {
                return e._id === f.mongo_id;
            })[0].id;
        });

        let subscriberEmails = newEvents.reduce((list, e) => {
            return list.concat(e.subscribers);
        }, []);

        // This guy is a member but subscribed to an event with an email
        // address that was not a member.
        subscriberEmails.push('nilslandin@gmail.com');

        return db.any(`SELECT * FROM member WHERE email IN ($1:csv)`, [subscriberEmails]);
    }).then(members => {
        console.log('INSERT EVENT SUBSCRIBERS');
        return db.task(tx => {
            let queries = [];

            newEvents.forEach(e => {
                e.subscribers.forEach(es => {
                    if (es === 'nils.landin@ingenjorerutangranser.se') {
                        es = 'nilslandin@gmail.com';
                    }

                    let member = members.filter(m => { return m.email === es; })[0];

                    queries.push(tx.none(`
                        INSERT INTO event_subscriber (event_id, member_id)
                        VALUES ($1, $2)
                    `, [e.id, member.id]));
                });
            });

            return tx.batch(queries);
        });
    }).then(() => {
        let emails = [];

        newEvents.forEach(e => {
            e.participant_emails = [];

            e.participants.forEach(p => {
                let ep = eventParticipants.filter(ep => {
                    return `ObjectId(${p.$oid})` === ep._id;
                })[0];

                e.participant_emails.push(ep.email);

                emails.push(ep.email);
            });
        });

        return db.any(`SELECT * FROM member WHERE email IN ($1:csv)`, [emails]);
    }).then(members => {
        console.log('INSERT EVENT PARTICIPANTS');

        newEvents.forEach(e => {
            e.participant_ids = [];

            e.participant_emails.forEach(p => {
                let member = members.filter(m => {
                    return p === m.email;
                })[0];

                e.participant_ids.push(member.id);
            });
        });

        return db.task(tx => {
            let queries = [];

            newEvents.forEach(e => {
                e.participant_ids.forEach(ep => {
                    queries.push(tx.none(`
                        INSERT INTO event_participant (event_id, member_id)
                        VALUES ($1, $2)
                    `, [e.id, ep]));
                });
            });

            return tx.batch(queries);
        });
    });
}

function insertEventAddons(newEventAddons, newEvents) {
    console.log('INSERT EVENT ADDONS');

    return db.any(`
        SELECT * 
        FROM product 
        WHERE product_type_id = (
            SELECT id 
            FROM product_type 
            WHERE identifier = 'Event'
        )`).then(products => {

        products.forEach(p => {
            let addon = newEventAddons.filter(a => {
                return p.mongo_id === a.product;
            })[0];

            p.event_addon_id = addon._id;
            p.capacity = addon.capacity;
        });

        return db.any('SELECT * FROM event').then(events => {
            return Promise.resolve([products, events]);
        });
    }).then(([products, events]) => {
        events.forEach(e => {
            let newEvent = newEvents.filter(ne => {
                return ne._id === e.mongo_id;
            })[0];

            e.products = JSON.parse(newEvent.addons);
        });

        return db.task(tx => {
            let queries = [];

            events.forEach(e => {
                e.products.forEach(id => {
                    let product = products.filter(p => {
                        return `ObjectId(${id.$oid})` === p.event_addon_id;
                    })[0];

                    queries.push(tx.none(`
                        INSERT INTO event_product (event_id, capacity, product_id)
                        VALUES ($1, $2, $3)
                    `, [e.id, product.capacity, product.id]));
                });
            })

            return tx.batch(queries);
        });
    });
}

db.task(tx => {
    console.log('ADDING mongo_id COLUMNS');
    let queries = [
        tx.any('alter table member add column if not exists mongo_id text'),
        tx.any('alter table product_type add column if not exists mongo_id text'),
        tx.any('alter table product add column if not exists mongo_id text'),
        tx.any('alter table payment add column if not exists mongo_id text'),
        tx.any('alter table event add column if not exists mongo_id text'),
    ];

    return tx.batch(queries);
}).then(() => {
    return db.task(tx => {
        console.log('EMPTYING CONTENT');
        let queries = [
            tx.any('delete from member'),
            tx.any('delete from product_type'),
            tx.any('delete from product'),
            tx.any('delete from payment'),
            tx.any('delete from payment_product'),
            tx.any('delete from setting'),
            tx.any('delete from event'),
            tx.any('delete from event_participant'),
            tx.any('delete from event_subscriber'),
            tx.any('delete from event_payment'),
            tx.any('delete from event_product'),
        ];

        return tx.batch(queries);
    });
}).then(() => {
    return main();
}).then(() => {
    return db.task(tx => {
        console.log('DROPPING mongo_id COLUMNS');
        let queries = [
            tx.any('alter table member drop column mongo_id'),
            tx.any('alter table product_type drop column mongo_id'),
            tx.any('alter table product drop column mongo_id'),
            tx.any('alter table payment drop column mongo_id'),
            tx.any('alter table event drop column mongo_id'),
        ];

        return tx.batch(queries);
    });
}).then(() => {
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(2);
});


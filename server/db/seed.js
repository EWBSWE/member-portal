'use strict';

let moment = require('moment');
let Promise = require('bluebird');

let db = require('../db').db;

let Event = require('../models/event.model');
let Member = require('../models/member.model');
let MemberType = require('../models/member-type.model');
let Payment = require('../models/payment.model');
let Product = require('../models/product.model');
let ProductType = require('../models/product-type.model');

function insertAuthenticatableMembers() {
    return Member.create([{
        email: 'admin@admin.se',
        password: 'Admin123',
        role: 'admin',
    }, {
        email: 'user@user.se',
        password: 'password123',
        role: 'user',
    }]);
}

function insertDummyMembers() {
    let genders = ['male', 'female', 'other'];

    return MemberType.index().then(memberTypes => {

        let members = Array.apply(null, {length: 100}).map((_, index) => {
            return {
                name: `Member Membersson ${index}`,
                email: `member${index}@example.com`,
                location: 'Membertown',
                education: 'Member Science',
                profession: 'Consultant Member',
                memberTypeId: memberTypes[Math.floor(Math.random() * memberTypes.length)].id,
                gender: genders[Math.floor(Math.random() * 3)],
                yearOfBirth: 1970 + (index % 20),
                expirationDate: moment().add(365 + index, 'days').toDate(),
            };
        });

        return Member.create(members);
    });
}

function insertProducts() {
    return MemberType.index().then(memberTypes => {
        return ProductType.create(ProductType.MEMBERSHIP).then(productType => {
            let oneYears = memberTypes.map(memberType => {
                return {
                    name: `Medlemskap 1 år ${memberType.member_type}`,
                    price: 100,
                    description: 'This is a description',
                    attribute: {
                        member_type_id: memberType.id,
                        days: 365,
                    },
                    productTypeId: productType.id,
                }
            });

            let threeYears = memberTypes.map(memberType => {
                return {
                    name: `Medlemskap 3 år ${memberType.member_type}`,
                    price: 240,
                    description: 'This is a description',
                    attribute: {
                        member_type_id: memberType.id,
                        days: 365 * 3,
                    },
                    productTypeId: productType.id,
                }
            });

            let products = oneYears.concat(threeYears);

            return Product.create(products);
        });
    });
}

function insertProductPayments() {
    return ProductType.find(ProductType.MEMBERSHIP).then(productType => {
        return Product.findByProductTypeId(productType.id);
    }).then(products => {
        return Member.index().then(members => {
            let payments = members.map((m, index) => {
                let randomProduct = products[Math.floor(Math.random() * products.length)];
                return {
                    member: m,
                    amount: randomProduct.price,
                    createdAt: moment().subtract(index + Math.floor(Math.random() * 100) + 1, 'days').toDate(),
                    products: [randomProduct],
                };
            });

            return Payment.create(payments);
        });
    })
}

function insertEvent() {
    return ProductType.create(ProductType.EVENT).then(productType => {
        return Event.create({
            name: 'event',
            identifier: 'identifier',
            description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
            active: true,
            dueDate: moment().add(1, 'month').toDate(),
            notificationOpen: false,
            emailTemplate: {
                sender: 'ict@ingenjorerutangranser.se',
                subject: 'subject',
                body: 'body',
            },
            addons: [{
                capacity: 100,
                name: 'Free',
                description: 'Free description',
                price: 0,
            }, {
                capacity: 10,
                name: 'Not free',
                description: 'Not free description',
                price: 10,
            }],
            subscribers: ['admin@admin.se'],
        });
    });
}

function insertParticipants() {
    return Event.findWithAddons('identifier').then(e => {
        return Event.addParticipant(e.id, {
            name: 'Some Guy',
            email: 'some@email.se',
            addonIds: e.addons.map(a => { return a.id; }),
            message: 'Message',
        });
    });
}

function empty() {
    return db.tx(t => {
        let queries = [
            t.any(`DELETE FROM payment`),
            t.any(`DELETE FROM payment_product`),
            t.any(`DELETE FROM member`),
            t.any(`DELETE FROM product`),
            t.any(`DELETE FROM product_type`),
            t.any(`DELETE FROM event`),
            t.any(`DELETE FROM event_product`),
            t.any(`DELETE FROM event_payment`),
            t.any(`DELETE FROM event_participant`),
            t.any(`DELETE FROM event_subscriber`),
            t.any(`DELETE FROM email_template`),
        ];

        return t.batch(queries);
    });
}

function populate() {
    let members = [
        insertAuthenticatableMembers(),
        insertDummyMembers(),
    ];

    return Promise.all(members).then(() => {
        return insertProducts();
    }).then(() => {
        return insertProductPayments();
    }).then(() => {
        return insertEvent();
    }).then(() => {
        return insertParticipants();
    }).catch(err => {
        console.log('Error while seeding!');
        console.log(err);
    });
}


module.exports = {
    empty: empty,
    populate: populate
}

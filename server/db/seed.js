'use strict';

let moment = require('moment');
let Promise = require('bluebird');

let db = require('../db').db;

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
                    memberId: m.id,
                    amount: randomProduct.price,
                    createdAt: moment().subtract(index + Math.floor(Math.random() * 100) + 1, 'days'),
                    products: [randomProduct.id],
                };
            });

            return Payment.create(payments);
        });
    })

}

function empty() {
    return db.tx(t => {
        let queries = [
            t.any(`DELETE FROM payment`),
            t.any(`DELETE FROM payment_product`),
            t.any(`DELETE FROM ewb_error`),
            t.any(`DELETE FROM member`),
            t.any(`DELETE FROM product`),
            t.any(`DELETE FROM product_type`),
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
    }).catch(err => {
        console.log('Error while seeding!');
        console.log(err);
    });
}


module.exports = {
    empty: empty,
    populate: populate
}

'use strict';

let moment = require('moment');
let Promise = require('bluebird');

let db = require('../db').db;

let Member = require('../models/member.model');
let MemberType = require('../models/member-type.model');
let Payment = require('../models/payment.model');

function insertAuthenticatableMembers() {
    return Member.create({
        email: 'admin@admin.se',
        password: 'Admin123',
        role: 'admin',
    });
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

function insertPayments() {
    return Member.index().then(members => {
        let payments = members.map((m, index) => {
            return {
                memberId: m.id,
                amount: Math.floor(Math.random() * 200) + 80,
                createdAt: moment().subtract(index + Math.floor(Math.random() * 100) + 1, 'days'),
            };
        });

        return Payment.create(payments);
    });
}

function empty() {
    return db.tx(t => {
        let queries = [
            t.any(`DELETE FROM payment`),
            t.any(`DELETE FROM ewb_error`),
            t.any(`DELETE FROM member`),
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
        return insertPayments();
    }).catch(err => {
        console.log('Error while seeding!');
        console.log(err);
    });
}


module.exports = {
    empty: empty,
    populate: populate
}

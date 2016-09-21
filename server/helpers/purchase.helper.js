'use strict';

var Promise = require('bluebird');

var db = require('../db').db;

var Member = require('../models/member.model');

function membership(product, memberData) {
    return db.oneOrNone(`
        SELECT id FROM member WHERE email = $1
    `, memberData.email).then(maybeMember => {
        if (!maybeMember) {
            return db.one(`
                SELECT id FROM member_type WHERE member_type = $1`
            , product.attribute.memberType).then(memberType => {
                memberData.memberTypeId = memberType.id;
                return Member.create(memberData);
            });
        }

        return Promise.resolve(maybeMember);
    }).then(member => {
        return db.one(`
            INSERT INTO payment (member_id, amount)
            VALUES ($1, $2)
            RETURNING id, member_id
        `, [member.id, product.price]).then(payment => {
            return Promise.resolve({
                member: member,
                payment: payment,
                product: product
            });
        });
    });

}

module.exports = {
    membership: membership,
};

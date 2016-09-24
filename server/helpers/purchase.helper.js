'use strict';

var Promise = require('bluebird');
var moment = require('moment');

var db = require('../db').db;

var Member = require('../models/member.model');

function membership(product, memberData) {
    return Member.find(memberData.email).then(maybeMember => {
        if (!maybeMember) {
            memberData.expirationDate = moment().add(product.attribute.durationDays, 'days');
            return db.one(`
                SELECT id FROM member_type WHERE member_type = $1`
            , product.attribute.memberType).then(memberType => {
                memberData.memberTypeId = memberType.id;
                return Member.create(memberData);
            });
        }

        memberData.expiration_date = moment(maybeMember.expiration_date).add(product.attribute.durationDays, 'days');

        return Member.update(maybeMember.id, Object.assign(maybeMember, memberData));
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

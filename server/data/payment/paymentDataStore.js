'use strict';

const db = require('../../db').db;

const PaymentEntity = require('./paymentEntity');

async function findWhere(parameters) {
  const { toMatch, against } = PaymentEntity.query(parameters);

  return db.any(`
    SELECT id, member_id, amount, created_at
    FROM payment
    WHERE ${toMatch}
    `, against);
}

async function findProductIds(paymentId) {
  return db.any(`
    SELECT product_id
    FROM payment_product
    WHERE payment_id = $1
    `, paymentId);
}

async function findMembershipPayments(memberId) {
  return db.any(`
    SELECT id, product_id
    FROM payment
    LEFT JOIN payment_product ON payment.id = payment_product.payment_id
    WHERE 
      product_id IN (
        SELECT id
        FROM product
        WHERE product_type_id = (
          SELECT id
          FROM product_type
          WHERE identifier = 'Membership'
        )
      ) AND
      member_id = $1
    `, memberId);
}

module.exports = {
  findWhere,
  findProductIds,
  findMembershipPayments,
};

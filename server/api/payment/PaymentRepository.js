'use strict';

const db = require('./db').db;

const { Payment } = require('./Payment');

class PaymentRepository {
  async create(payment, products) {
    // assert payment is payment?
    // assert product is product?
    const entity = await db.tx(async t => {
      const entity = await t.one(this._getInsertPaymentSql(), payment);

      // what happens when there is more than one product?
      // just iterate over all products perhaps?
      for (const product in products) {
	await t.none(
	  this._getInsertPaymentProductSql(),
	  {
	    paymentId: entity.id,
	    productId: product.id
	  }
	);
      }

      return entity;
    });

    return this._toPaymentModel(entity);
  }

  _toPaymentModel(entity) {
    return new Payment(
      entity.id,
      entity.member_id,
      entity.currency_code,
      entity.amount,
      entity.created_at
    );
  }

  _getInsertPaymentSql() {
    return `
	INSERT INTO payment (member_id, amount) 
	VALUES ($[memberId], $[amount])
	RETURNING *
    `;
  }

  _getInsertPaymentProductSql() {
    return `
	INSERT INTO payment_product (payment_id, product_id) 
	VALUES ($[paymentId], $[productId])
    `;
  }
}

module.exports = new PaymentRepository();

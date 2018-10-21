'use strict';

const db = require('../../db').db;

const { MembershipProduct } = require('./Product');

class ProductRepository {
  async getMembershipProduct(id) {
    const entity = await db.one(`
	SELECT *
	FROM product
	WHERE id = $1
	    AND product_type_id = (
		SELECT id
		FROM product_type
		WHERE identifier = 'Membership'
	    )
    `, [id]);

    return this._toMembershipProduct(entity);
  }

  _toMembershipProduct(entity) {
    return new MembershipProduct(
      +entity.id,
      entity.name,
      +entity.price,
      entity.description,
      +entity.product_type_id,
      entity.currency_code,
      +entity.attribute.member_type_id,
      +entity.attribute.days
    );
  }
}

module.exports = new ProductRepository();

'use strict';

const db = require('../../db').db;

async function getMemberships() {
  const membershipProductType = await db.one(`
    SELECT id 
    FROM product_type 
    WHERE identifier = 'Membership'
    `);

  const membershipEntities = await db.any(`
    SELECT id, name, attribute, product_type_id
    FROM product
    WHERE product_type_id = $1
    `, membershipProductType.id);

  return membershipEntities;
}

module.exports = {
  getMemberships
};

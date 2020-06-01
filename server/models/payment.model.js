/**
 * Payment model
 *
 * @namespace model.Payment
 * @memberOf model
 */

"use strict";

var db = require("../db").db;

var postgresHelper = require("../helpers/postgres.helper");

const COLUMN_MAP = {
  amount: "amount",
  memberId: "member_id",
  currencyCode: "currency_code",
  createdAt: "created_at",
};

/**
 * Find all payments by specifying attributes
 *
 * @memberOf model.Payment
 * @param {Object} data - Object containing attributes to query against.
 * @returns {Promise<Array|Error>} Resolves to an array of objects.
 */
function findBy(data) {
  let wheres = postgresHelper.where(COLUMN_MAP, data);

  return db.any(
    `
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        WHERE ${wheres.clause}
    `,
    wheres.data
  );
}

module.exports = {
  get: get,
  findBy: findBy,
};

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
 * Fetch all payments
 *
 * @memberOf model.Payment
 * @returns {Promise<Array|Error>} Resolves to an array of payments
 */
function index() {
  return db.any(`
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        ORDER BY created_at DESC
    `);
}

/**
 * Fetch a payment
 *
 * @memberOf model.Payment
 * @param {Number} id - Payment id
 * @returns {Promise<Object|Error>} Resolves to a payment
 */
function get(id) {
  return db.one(
    `
        SELECT id, member_id, amount, currency_code, created_at
        FROM payment
        WHERE id = $1
    `,
    id
  );
}

/**
 * Create payments
 *
 * @memberOf model.Payment
 * @param {Object|Array} data - Either an object or an array of objects
 * containing payment attributes>
 * @returns {Promise<Object|Array|Error>} Resolves to either to an object or
 * array of objects.
 */
function create(data) {
  let _create = (payment, transaction) => {
    let { columns, wrapped } = postgresHelper.mapDataForInsert(
      COLUMN_MAP,
      payment
    );

    let sql = `
            INSERT INTO payment (${columns})
            VALUES (${wrapped})
            RETURNING id
        `;

    return transaction.one(sql, payment);
  };

  let _joinTable = (paymentId, productId, transaction) => {
    let sql = `
            INSERT INTO payment_product (payment_id, product_id)
            VALUES ($1, $2)
        `;

    return transaction.none(sql, [paymentId, productId]);
  };

  // Simplify and adjust for the case where input is just an object instead
  // of an array of objects. And put this in a new variable since we don't
  // want to mess with the input.
  let inputs = Array.isArray(data) ? data : [data];

  inputs = inputs.map((i) => {
    if (i.member === undefined || i.member === null) {
      return null;
    }
    if (
      i.products === undefined ||
      i.products === null ||
      i.products.length === 0
    ) {
      return null;
    }

    return {
      amount: i.products.reduce((total, product) => {
        return total + product.price;
      }, 0),
      memberId: i.member.id,
      products: i.products,
    };
  });

  if (inputs.includes(null)) {
    return Promise.reject("Payment: Missing attributes");
  }

  return db
    .tx((transaction) => {
      let queries = inputs.map((payment) => {
        return _create(payment, transaction);
      });

      // First we create all the payment entries and then we create the
      // helper entries required to map out the many to many relationship.
      return transaction.batch(queries).then((payments) => {
        // Variables inputs and payments should be of the same size if all
        // INSERTs were successful.
        inputs = inputs.map((payment, index) => {
          payment.id = payments[index].id;

          return payment;
        });

        let queries = [];

        inputs.forEach((payment) => {
          queries = queries.concat(
            payment.products.map((product) => {
              return _joinTable(payment.id, product.id, transaction);
            })
          );
        });

        return transaction.batch(queries).then(() => {
          return Promise.resolve(payments);
        });
      });
    })
    .then((payments) => {
      // Depending on the argument to the create function we return it
      // appropriately. That is, pass an object get an object, pass an array
      // get an array.
      if (Array.isArray(data)) {
        return Promise.resolve(payments);
      } else {
        return Promise.resolve(payments[0]);
      }
    });
}

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

function formatProductList(products) {
  var text = "";

  for (var i = 0; i < products.length; i++) {
    var product = products[i];
    text +=
      product.name +
      "  -  " +
      product.price +
      " " +
      product.currency_code +
      "\n";
  }

  return text;
}

function formatTotal(products) {
  if (products.length === 0) {
    // TODO add some default currency or let something decide currency
    return "0 SEK";
  }

  var total = products.reduce(function (total, product) {
    return total + product.price;
  }, 0);

  return total + " SEK";
}

function formatTax(products) {
  // TODO When products include tax, fix this.
  return "0 SEK";
}

module.exports = {
  index: index,
  get: get,
  findBy: findBy,
  create: create,
  formatProductList: formatProductList,
  formatTotal: formatTotal,
  formatTax: formatTax,
};

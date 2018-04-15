'use strict';

const db = require('../server/db').db;

const productRepository = require('../server/data/product/productRepository');
const paymentRepository = require('../server/data/payment/paymentRepository');

async function fixMissingMemberTypeId() {
  const membershipProducts = await productRepository.getMemberships();
  const incompleteMembers = await findIncompleteMembers();

  const updates = await db.tx(async transaction => {
    const queryPromises = incompleteMembers.map(async incompleteMember => {
      // Consider the last payment to be the most up to date
      const latestPayment = await findLatestPayment(incompleteMember.id);

      if (!latestPayment) {
        // Could fetch latest payment for some reason.
        console.log(`Missing payments for member with id ${incompleteMember.id}`);
        return null;
      }

      const product = getProductFromPayment(membershipProducts, latestPayment);
      const memberTypeId = getMemberTypeIdFromProduct(product);

      return updateMemberWithMemberTypeId(transaction, incompleteMember.id, memberTypeId);
    });

    const queries = await Promise.all(queryPromises);

    // Remove malformed queries
    const validatedQueries = queries.filter(q => q);

    if (validatedQueries.length == 0) {
      console.log(`No members to process`);
      return Promise.resolve();
    }

    return transaction.batch(validatedQueries);
  });

  console.log(`Fixed ${incompleteMembers.length} members`);
}

async function findIncompleteMembers() {
  const members = await db.any(`
    SELECT id
    FROM member
    WHERE member_type_id IS NULL AND expiration_date IS NOT NULL
    `);

  return members;
}

async function findLatestPayment(memberId) {
  const payments = await paymentRepository.findMembershipPayments(memberId);

  if (payments.length === 0) {
    return null;
  }

  // Find the latest membership payment
  const latestPayment = payments.reduce((latest, current) => {
    const currentIsLater = latest.createdAt < current.createdAt;
    return currentIsLater ? current : latest;
  }, payments[0]);

  return latestPayment;
}

async function updateMemberWithMemberTypeId(transaction, memberId, memberTypeId) {
  //console.log(`Updating member ${memberId} with ${memberTypeId}`);
  //return Promise.resolve();
  return transaction.one(`
    UPDATE member
    SET
      member_type_id = $1
    WHERE
      id = $2
    RETURNING id
    `, [memberTypeId, memberId]);
}

function getProductFromPayment(products, payment) {
  return products.find(p => p.id === payment.product_id);
}

function getMemberTypeIdFromProduct(product) {
  return product.attribute.member_type_id;
}

//module.exports = {
  //fixMissingMemberTypeId
//};

fixMissingMemberTypeId()
  .then(() => {
    console.log('All done!');
    process.exit(0);
  })
  .catch(e => {
    console.log(e);
    process.exit(1);
  });


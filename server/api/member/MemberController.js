'use strict';

const moment = require('moment');

const logger = require('../../config/logger');

const stripe = require('../../stripe');

const { Member } = require('./Member');
const { MembershipProduct } = require('../product/Product');
const { OutgoingMessage } = require('../outgoing-message/OutgoingMessage');
const { Payment } = require('../payment/Payment');

const chapterRepository = require('./ChapterRepository');
const memberRepository = require('./MemberRepository');
const outgoingMessageRepository = require('../outgoing-message/OutgoingMessageRepository');
const paymentRepository = require('../payment/PaymentRepository');
const productRepository = require('../product/ProductRepository');

async function createMemberFromPurchase(params) {
  const email = params.email.trim();
  const productId = params.productId;
  const stripeToken = params.stripeToken;

  const name = params.name;
  const location = params.location;
  const profession = params.profession;
  const education = params.education;
  const gender = params.gender;
  const yearOfBirth = params.yearOfBirth;

  const chapter = await chapterRepository.get(params.chapterId);
  const chapterId = chapter ? chapter.id : null;
  if (!chapter) {
    logger.warn(`Couldn't find Chapter with chapter id [${params.chapterId}]`);
  }

  const membershipProduct = await productRepository.getMembershipProduct(productId);
  const memberTypeId = membershipProduct.memberTypeId;

  await stripe.processCharge2(
    stripeToken,
    membershipProduct.currencyCode,
    membershipProduct.price,
    membershipProduct.name
  );

  const maybeMember = await memberRepository.firstWithEmail(email);

  let member = null;
  if (maybeMember) {
    // Member exists! Update member with all attributes in case they
    // have changed. 
    maybeMember.name = name;
    maybeMember.memberTypeId = memberTypeId;
    maybeMember.location = location;
    maybeMember.profession = profession;
    maybeMember.education = education;
    maybeMember.gender = gender;
    maybeMember.yearOfBirth = yearOfBirth;
    maybeMember.chapterId = chapterId;

    maybeMember.extendExpirationDate(membershipProduct.membershipDurationDays);

    member = await memberRepository.update(maybeMember);
  } else {
    // Member doesn't exist! Create a member with provided attributes
    const newMember = new Member(
      null, // we have no id yet
      email,
      name,
      location,
      education,
      profession,
      memberTypeId,
      gender,
      yearOfBirth,
      null, // expiration date is not set yet
      chapterId
    );

    maybeMember.extendExpirationDate(membershipProduct.membershipDurationDays);

    member = await memberRepository.create(newMember);
  }

  // TODO There should be a better way than to create a Payment like
  // this. Delegate this job to some kind of transaction manager or
  // whatever. Use it
  // like... FooProcessor.confirmMemberPurchase(member, [product])?
  const payment = new Payment(
    null, // no id yet
    member.id,
    membershipProduct.currencyCode,
    membershipProduct.price,
    null // database creates this attribute for us
  );

  await paymentRepository.create(payment);

  // send mail and receipt to user
  const welcomeMail = OutgoingMessage.createMembership(member);
  const receiptMail = OutgoingMessage.createReceipt(member.email, [membershipProduct]);

  // TODO consider doing this with one punch
  await outgoingMessageRepository.create(welcomeMail);
  await outgoingMessageRepository.create(receiptMail);

}

async function getChapters() {
  return chapterRepository.findAll();
}

module.exports = {
  createMemberFromPurchase,
  getChapters
};

'use strict';

const moment = require('moment');
const stripe = require('../../stripe');
const OutgoingMessage = require('../../models/outgoing-message.model');

const { Member } = require('./Member');
const { MembershipProduct } = require('../product/Product');
const { Payment } = require('../payment/Payment');

const chapterRepository = require('./ChapterRepository');
const memberRepository = require('./MemberRepository');
const paymentRepository = require('../payment/PaymentRepository');
const productRepository = require('../product/ProductRepository');

async function createMemberFromPurchase(params) {
  const email = params.email.trim();
  const productId = params.productId;
  const stripeToken = params.stripeToken;
  const maybeChapterId = params.chapterId;

  const name = params.name;
  const location = params.location;
  const profession = params.profession;
  const education = params.education;
  const gender = params.gender;
  const yearOfBirth = params.yearOfBirth;

  const memberAttributes = {
    email,
    name,
    location,
    profession,
    education,
    gender,
    yearOfBirth
  };

  const membershipProduct = await productRepository.getMembershipProduct(productId);

  memberAttributes.memberTypeId = membershipProduct.memberTypeId;

  await stripe.processCharge2(
    stripeToken,
    membershipProduct.currencyCode,
    membershipProduct.price,
    membershipProduct.name
  );

  const maybeMember = await memberRepository.firstWithEmail(memberAttributes.email);

  let member = null;
  if (maybeMember) {
    // Member exists! Update member with all attributes in case they
    // have changed. 
    maybeMember.name = memberAttributes.name;
    maybeMember.memberTypeId = memberAttributes.memberTypeId;
    maybeMember.location = memberAttributes.location;
    maybeMember.profession = memberAttributes.profession;
    maybeMember.education = memberAttributes.education;
    maybeMember.gender = memberAttributes.gender;
    maybeMember.yearOfBirth = memberAttributes.yearOfBirth;

    maybeMember.extendExpirationDate(membershipProduct.membershipDurationDays);

    member = await memberRepository.update(maybeMember);
  } else {
    // Member doesn't exist! Create a member with provided attributes
    const newMember = new Member(
      null, // we have no id yet
      memberAttributes.email,
      memberAttributes.name,
      memberAttributes.location,
      memberAttributes.education,
      memberAttributes.profession,
      memberAttributes.memberTypeId,
      memberAttributes.gender,
      memberAttributes.yearOfBirth,
      null // expiration date is not set yet
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
  await OutgoingMessage.createMembership(memberAttributes.email, member.expiration_date);
  await OutgoingMessage.createReceipt(memberAttributes.email, [membershipProduct]);
}

async function getChapters() {
  return chapterRepository.findAll();
}

module.exports = {
  createMemberFromPurchase,
  getChapters
};

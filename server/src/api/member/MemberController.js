"use strict";

const logger = require("../../config/logger");

const stripe = require("../../stripe");

const { Member } = require("./Member");
const { MembershipProduct } = require("../product/Product");
const { OutgoingMessage } = require("../outgoing-message/OutgoingMessage");
const { Payment } = require("../payment/Payment");

const chapterRepository = require("./ChapterRepository");
const memberRepository = require("./MemberRepository");
const outgoingMessageRepository = require("../outgoing-message/OutgoingMessageRepository");
const paymentRepository = require("../payment/PaymentRepository");
const productRepository = require("../product/ProductRepository");
const MemberFactory = require("./MemberFactory");

const { mapBy, partition } = require("../../util");

async function createMemberFromPurchase(params) {
  const email = params.email.trim();
  const productId = params.productId;
  const stripeToken = params.stripeToken;

  const name = params.name;
  const location = params.location;
  const profession = params.profession;
  const education = params.education;
  const gender = params.gender;
  const employer = params.employer;

  let yearOfBirth = null;
  if (Number.parseInt(params.yearOfBirth) > 0) {
    yearOfBirth = Number(`${params.yearOfBirth}`.substr(0, 4));
  }

  logger.info(`Fetching chapter with id ${params.chapterId}`);
  const chapter = await chapterRepository.get(params.chapterId);
  const chapterId = chapter ? chapter.id : null;
  if (!chapter) {
    logger.warn(`Couldn't find Chapter with chapter id [${params.chapterId}]`);
  }

  logger.info(`Fetching membership product with id ${productId}`);
  const membershipProduct = await productRepository.getMembershipProduct(
    productId
  );
  const memberTypeId = membershipProduct.memberTypeId;
  logger.info(`Membership product is member type id ${memberTypeId}`);

  await stripe.processCharge2(
    stripeToken,
    membershipProduct.currencyCode,
    membershipProduct.price,
    membershipProduct.name
  );

  logger.info("Check if member exists");
  const maybeMember = await memberRepository.firstWithEmail(email);

  let member = null;
  if (maybeMember) {
    logger.info("Existing member - old attributes %j", maybeMember);
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
    maybeMember.employer = employer;

    maybeMember.extendExpirationDate(membershipProduct.membershipDurationDays);

    logger.info("Existing member - new attributes %j", maybeMember);
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
      chapterId,
      employer
    );

    newMember.extendExpirationDate(membershipProduct.membershipDurationDays);

    logger.info("New member - new attributes %j", newMember);
    member = await memberRepository.create(newMember);
  }

  logger.info("Member saved/updated");

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
  logger.info("Creating payment %j", payment);

  await paymentRepository.create(payment);

  logger.info("Payment saved");

  logger.info("Preparing emails, welcome/receipt");
  // send mail and receipt to user
  const welcomeMail = OutgoingMessage.createMembership(member);
  const receiptMail = OutgoingMessage.createReceipt(member.email, [
    membershipProduct,
  ]);

  // TODO consider doing this with one punch
  await outgoingMessageRepository.create(welcomeMail);
  await outgoingMessageRepository.create(receiptMail);
  logger.info("Emails queued");
}

async function getChapters() {
  return chapterRepository.findAll();
}

async function bulk(params) {
  const emails = params.members.map((data) => data.email);
  const existingMembers = await memberRepository.findByEmails(emails);

  // TODO: Check if any existing member is admin and throw error.

  const existingEmails = existingMembers.map((member) => member.email);

  // Remove existing members from input
  const maybeNewMembers = params.members
    .filter((data) => !existingEmails.includes(data.email))
    .map((maybeValidMember) => MemberFactory.create(maybeValidMember));

  const { left: toCreate, right: invalid } = partition(
    maybeNewMembers,
    (member) => member.isCreatable()
  );

  if (toCreate.length > 0) {
    await memberRepository.createMany(toCreate);
  }

  const memberParamsByEmail = mapBy(params.members, (data) => data.email);
  existingMembers.forEach((member) => {
    // The reason for updating member attributes here instead of
    // delegating to a Member function is to not couple the logic too
    // tight at the time of writing. There are also things to consider
    // when updating values, what if some value is undefined or null?
    // Do we update or keep the old? In some cases it might make sense
    // to keep the old value but for this bulk create/update members
    // we explicitly take the provided value and replace any current
    // ones.
    const memberParams = memberParamsByEmail[member.email];
    member.name = memberParams.name;
    member.location = memberParams.location;
    member.education = memberParams.education;
    member.profession = memberParams.profession;
    member.memberTypeId = memberParams.memberTypeId;
    member.gender = memberParams.gender;
    member.yearOfBirth = memberParams.yearOfBirth;
    member.expirationDate = memberParams.expirationDate;
    member.chapterId = memberParams.chapterId;
    member.employer = memberParams.employer;
  });

  if (existingMembers.length > 0) {
    await memberRepository.updateMany(existingMembers);
  }

  return {
    updated: existingMembers,
    created: toCreate,
    invalid,
  };
}

async function update(params, urlParams) {
  const memberId = urlParams.id;
  const member = await memberRepository.get(memberId);

  logger.info(
    `Updating member ${memberId} old attributes %j with %j`,
    member,
    params
  );

  member.name = params.name;
  member.location = params.location;
  member.education = params.education;
  member.profession = params.profession;
  member.memberTypeId = params.memberTypeId;
  member.gender = params.gender;
  member.yearOfBirth = params.yearOfBirth;
  member.expirationDate = params.expirationDate;
  member.chapterId = params.chapterId;
  member.employer = params.employer;

  await memberRepository.update(member);

  return member.formatResponse();
}

module.exports = {
  createMemberFromPurchase,
  getChapters,
  bulk,
  update,
};

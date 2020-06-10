import { MemberController } from "../../src/member/MemberController";
import sinon = require("sinon");
import { OutgoingMessageFactory } from "../../src/outgoing-message/OutgoingMessageFactory";
import { stubMessageRepository } from "../user/UserControllerTest";
import { MemberRepository } from "../../src/member/MemberRepository";
import { ConfirmMembershipRequest } from "../../src/member/ConfirmMembershipRequest";
import { ChapterRepository } from "../../src/member/ChapterRepository";
import { ProductRepository } from "../../src/product/ProductRepository";
import { MembershipProduct } from "../../src/product/Product";
import { Member, UnsavedMember } from "../../src/member/Member";
import { MemberType } from "../../src/member/MemberType";
import * as stripe from "../../src/Stripe";
import { assert } from "chai";
import moment = require("moment");
import { assertResultMessage, assertResultEmpty } from "../assertResult";
import { OutgoingMessage } from "../../src/outgoing-message/OutgoingMessage";
import { argsOf } from "./argsOf";

describe("MemberController", function () {
  const sandbox = sinon.createSandbox();
  afterEach(function () {
    sandbox.restore();
  });

  describe("confirmMembership", function () {
    it("renews membership", async function () {
      sandbox.stub(stripe, "processCharge2").resolves();

      const memberRepositoryStub = stubMemberRepository(
        sandbox,
        createMember()
      );
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      await sut.confirmMembership(request);

      assert.isTrue(
        memberRepositoryStub.update.calledOnce,
        "Expected MemberRepository.update to be called once"
      );
    });

    it("creates member", async function () {
      sandbox.stub(stripe, "processCharge2").resolves();

      const member = createMember();
      const memberRepositoryStub = stubMemberRepository(sandbox, null);
      memberRepositoryStub.findByEmail
        .onFirstCall()
        .resolves(null)
        .onSecondCall()
        .resolves(member);
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      await sut.confirmMembership(request);

      assert.isTrue(
        memberRepositoryStub.add.calledOnce,
        "Expected MemberRepository.add to be called once"
      );
    });

    it("fails if no membership product found", async function () {
      const memberRepositoryStub = stubMemberRepository(
        sandbox,
        createMember()
      );
      const productRepositoryStub = stubProductRepository(sandbox);
      productRepositoryStub.findMembership.resolves(null);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);

      assertResultMessage(result, /Membership product with id 4 not found/);
      assert.isTrue(
        productRepositoryStub.findMembership.calledOnce,
        "Expected ProductRepository.findMembership to be called once"
      );
    });

    it("fails if no member type found", async function () {
      sandbox.stub(stripe, "processCharge2").resolves();

      const memberRepositoryStub = stubMemberRepository(sandbox, null);
      memberRepositoryStub.findType.resolves(null);
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);
      assertResultMessage(result, /Member type with id 1 not found/);
    });

    it("fails if can't find created member", async function () {
      const memberRepositoryStub = stubMemberRepository(sandbox, null);
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);
      assertResultMessage(
        result,
        /Couldn't find member after creating\/updating/
      );
      assert.isTrue(
        memberRepositoryStub.add.calledOnce,
        "Expected MemberRepository.add to be called once"
      );
      assert.isTrue(
        memberRepositoryStub.findByEmail.calledTwice,
        "Expected MemberRepository.findByEmail to be called twice"
      );
    });

    it("fails if can't find updated member", async function () {
      sandbox.stub(stripe, "processCharge2").resolves();

      const member = createMember();
      const memberRepositoryStub = stubMemberRepository(sandbox, member);
      memberRepositoryStub.findByEmail
        .onFirstCall()
        .resolves(member)
        .onSecondCall()
        .resolves(null);
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);

      assertResultMessage(
        result,
        /Couldn't find member after creating\/updating/
      );
      assert.isTrue(
        memberRepositoryStub.update.calledOnce,
        "Expected MemberRepository.update to be called once"
      );
      assert.isTrue(
        memberRepositoryStub.findByEmail.calledTwice,
        "Expected MemberRepository.findByEmail to be called twice"
      );
    });

    it("reverts member expiration date for existing member if payment fails", async function () {
      sandbox.stub(stripe, "processCharge2").rejects();

      const expirationDate = moment().add(1, "year").toDate();
      const member = createMember();
      member.expirationDate = expirationDate;
      const memberRepositoryStub = stubMemberRepository(sandbox, member);
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);

      assertResultMessage(result, /Stripe failed to process the transaction/);
      assert.equal(
        expirationDate,
        member.expirationDate,
        "Expected member.expirationDate to be reset"
      );
      assert.isTrue(
        memberRepositoryStub.update.calledTwice,
        "Expected MemberRepository.update to be called twice"
      );
    });

    it("reverts member expiration date for new member if payment fails", async function () {
      sandbox.stub(stripe, "processCharge2").rejects();

      const member = createMember();
      const memberRepositoryStub = stubMemberRepository(sandbox, null);
      memberRepositoryStub.findByEmail
        .onFirstCall()
        .resolves(null)
        .onSecondCall()
        .resolves(member);
      memberRepositoryStub.add.callsFake((unsavedMember: UnsavedMember) => {
        member.expirationDate = unsavedMember.expirationDate;
        return Promise.resolve();
      });
      memberRepositoryStub.update.resolves();
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);
      assertResultMessage(result, /Stripe failed to process the transaction/);
      assert.equal(
        null,
        member.expirationDate,
        "Expected member.expirationDate to be reset"
      );
      assert.isTrue(
        memberRepositoryStub.update.calledOnce,
        "Expected MemberRepository.update to be called Once"
      );
    });

    it("creates receipt message", async function () {
      sandbox.stub(stripe, "processCharge2").resolves();

      const memberRepositoryStub = stubMemberRepository(
        sandbox,
        createMember()
      );
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);

      assertResultEmpty(result);
      assert.isTrue(
        messageRepositoryStub.enqueue.calledTwice,
        "Expected MessageRepository.enqueue to be called twice"
      );
      const messages = argsOf<OutgoingMessage>(messageRepositoryStub.enqueue);
      const receipt = messages[0];
      assert.equal("Receipt Dummy name", receipt.subject);
      assert.equal("dummy@email.com", receipt.recipient);
    });

    it("creates greeting message", async function () {
      sandbox.stub(stripe, "processCharge2").resolves();

      const memberRepositoryStub = stubMemberRepository(
        sandbox,
        createMember()
      );
      const productRepositoryStub = stubProductRepository(sandbox);
      const messageRepositoryStub = stubMessageRepository(sandbox);

      const sut = createSut(
        sandbox,
        memberRepositoryStub,
        productRepositoryStub,
        messageRepositoryStub
      );

      const request = createRequest();
      const result = await sut.confirmMembership(request);
      assertResultEmpty(result);
      assert.isTrue(
        messageRepositoryStub.enqueue.calledTwice,
        "Expected MessageRepository.enqueue to be called twice"
      );
      const messages = argsOf<OutgoingMessage>(messageRepositoryStub.enqueue);
      const welcome = messages[1];
      assert.equal("Welcome to Engineers without borders!", welcome.subject);
      assert.equal("dummy@email.com", welcome.recipient);
    });
  });
});

function createRequest(): ConfirmMembershipRequest {
  return {
    email: "dummy@email.com",
    productId: 4,
    stripeToken: {},
    name: null,
    location: null,
    profession: null,
    education: null,
    gender: null,
    employer: null,
    yearOfBirth: null,
    chapterId: null,
  };
}

function createMember(): Member {
  return new Member(
    1,
    "dummy@email.com",
    new Date(),
    new Date(),
    null,
    null,
    null,
    null,
    MemberType.STUDENT,
    null,
    null,
    null,
    null,
    null
  );
}

function stubMemberRepository(
  sandbox: sinon.SinonSandbox,
  member: Member | null
): any {
  const stub = sandbox.createStubInstance(MemberRepository);
  stub.findType.resolves(MemberType.WORKING);
  if (member != null) {
    stub.findByEmail.resolves(member);
    stub.update.resolves();
  } else {
    stub.findByEmail.resolves(null);
    stub.add.resolves();
  }
  return stub;
}

function stubProductRepository(sandbox: sinon.SinonSandbox): any {
  const dummyMembership = new MembershipProduct(
    1,
    1,
    "Dummy name",
    100,
    null,
    { days: 365, member_type_id: 1 },
    "SEK",
    new Date(),
    new Date()
  );
  const stub = sandbox.createStubInstance(ProductRepository);
  stub.findMembership.resolves(dummyMembership);
  return stub;
}

function createSut(
  sandbox: sinon.SinonSandbox,
  memberRepositoryStub: any,
  productRepositoryStub: any,
  messageRepositoryStub: any
): MemberController {
  const dummyChapterRepository: any = sandbox.createStubInstance(
    ChapterRepository
  );
  const dummyMessageFactory = new OutgoingMessageFactory(
    "noreply@localhost",
    "localhost"
  );

  return new MemberController(
    memberRepositoryStub,
    dummyChapterRepository,
    productRepositoryStub,
    dummyMessageFactory,
    messageRepositoryStub
  );
}

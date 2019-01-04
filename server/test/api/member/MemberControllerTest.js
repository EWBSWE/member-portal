'use strict';

const sinon = require('sinon');

const memberRepository = require('../../../api/member/MemberRepository');
const { Member } = require('../../../api/member/Member');

const MemberController = require('../../../api/member/MemberController');

describe('MemberController', function() {

  let sandbox;
  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });
  afterEach(function() {
    sandbox.restore();
  });

  describe('bulk', function() {
    it('should create a bunch of members', async function() {
      sandbox.stub(memberRepository, 'findByEmails')
	.resolves([]);

      sandbox.mock(memberRepository)
	.expects('createMany')
	.once()
	.resolves();

      sandbox.mock(memberRepository)
	.expects('updateMany')
	.never();

      const params = {
	members: [{
	  email: 'foo@example.com',
	}, {
	  email: 'bar@example.com',
	}]
      };

      const result = await MemberController.bulk(params);

      assert.equal(result.updated.length, 0);
      assert.equal(result.created.length, 2);
      assert.equal(result.invalid.length, 0);

      sandbox.verify();
    });

    it('should update existing members', async function() {
      sandbox.stub(memberRepository, 'findByEmails')
	.resolves([
	  new Member(1, 'foo@example.com'),
	  new Member(2, 'bar@example.com')
	]);

      sandbox.mock(memberRepository)
	.expects('createMany')
	.never();

      sandbox.mock(memberRepository)
	.expects('updateMany')
	.once()
	.resolves();

      const params = {
	members: [{
	  email: 'foo@example.com',
	}, {
	  email: 'bar@example.com',
	}]
      };

      const result = await MemberController.bulk(params);

      assert.equal(result.updated.length, 2);
      assert.equal(result.created.length, 0);
      assert.equal(result.invalid.length, 0);

      sandbox.verify();
    });

    it('should create new members and update existing members', async function() {
      sandbox.stub(memberRepository, 'findByEmails')
	.resolves([
	  new Member(1, 'foo@example.com')
	]);

      sandbox.mock(memberRepository)
	.expects('createMany')
	.once()
	.resolves();

      sandbox.mock(memberRepository)
	.expects('updateMany')
	.once()
	.resolves();

      const params = {
	members: [{
	  email: 'foo@example.com',
	}, {
	  email: 'bar@example.com',
	}]
      };

      const result = await MemberController.bulk(params);

      assert.equal(result.updated.length, 1);
      assert.equal(result.created.length, 1);
      assert.equal(result.invalid.length, 0);

      sandbox.verify();
    });

    it('should highlight invalid members', async function() {
      sandbox.stub(memberRepository, 'findByEmails')
	.resolves([
	  new Member(1, 'foo@example.com')
	]);

      sandbox.mock(memberRepository)
	.expects('createMany')
	.once()
	.resolves();

      sandbox.mock(memberRepository)
	.expects('updateMany')
	.once()
	.resolves();

      const params = {
	members: [{
	  email: 'foo@example.com',
	  name: 'foo'
	}, {
	  email: 'bar@example.com',
	  name: 'bar'
	}, {
	  email: undefined,
	  name: 'invalid'
	}]
      };

      const result = await MemberController.bulk(params);

      assert.equal(result.updated.length, 1);
      assert.equal(result.created.length, 1);
      assert.equal(result.invalid.length, 1);

      sandbox.verify();
    });
  });
});

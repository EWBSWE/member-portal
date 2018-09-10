'use strict';

const sinon = require('sinon');

const RouteBuilder = require('../RouteBuilder');

describe('RouteBuilder', function() {
  const successEndpoint = () => ({});
  const errorEndpoint = () => { throw new Error('This is an error'); };

  let sandbox;
  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });
  afterEach(function() {
    sandbox.restore();
  });

  describe('Error handling', function() {
    it('should throw error if no endpoint', function() {
      assert.throws(() => new RouteBuilder().build(), /Missing endpoint/);
    });

    it('should pass error to handler if missing require params', async function() {
      const route = new RouteBuilder(successEndpoint)
	    .requiredParams(['foo'])
	    .build();

      await route(
	{ body: {} },
	{},
	e => assert.match(e.message, /Missing parameters/)
      );
    });

    it('should pass error to handler if endpoint throws', async function() {
      const route = new RouteBuilder(errorEndpoint)
	    .requiredParams(['foo'])
	    .build();

      await route(
	{ body: { foo: 'bar' } },
	{},
	e => assert.match(e.message, /This is an error/)
      );
    });
  });
});

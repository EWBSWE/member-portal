'use strict';

const sinon = require('sinon');

const db = require('../../../db').db;

const Payment = require('../../../api/payment/Payment');
const PaymentRepository = require('../../../api/payment/PaymentRepository');
const Product = require('../../../api/product/Product');

describe('PaymentRepository', function() {
  let sandbox;
  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });
  afterEach(function() {
    sandbox.restore();
  });

  // Mon Oct 8 20:22:51 CEST 2018 - It doesn't make sense to mock all
  // the database logic. What is gained from stubbing those parts?
  // Better to run tests against a test database to make sure it's
  // right.
  describe('create', function() {
    it('should create payment when purchasing one product');
    it('should create payment when purchasing more than one product');
  });
});

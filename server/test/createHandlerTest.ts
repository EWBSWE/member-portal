import { Result, ok, empty, fail } from "../Result";
import { createHandler } from "../createHandler";
import * as express from "express";
import sinon = require("sinon");
import { assert } from "chai";
import { parseParams } from "../RequestValidation";
import Joi = require("@hapi/joi");

function createRequest(params: any): express.Request {
  return { params, body: {} } as any;
}

function createResponse(statusStub: sinon.SinonStub): any {
  const res = {
    json: (data: any) => {
      return res;
    },
    sendStatus: (code: any) => {
      statusStub(code);
      return res;
    },
    status: (code: any) => {
      statusStub(code);
      return res;
    },
  };

  return res;
}

const idRequiredSchema = Joi.object({ id: Joi.number().required() });

describe("createHandler", function () {
  const sandbox = sinon.createSandbox();

  let dummyEndpoint: any;
  let dummyNextFun: any;
  let dummyRequest: any;

  beforeEach(function () {
    dummyEndpoint = sandbox.stub().resolves(ok("some response"));
    dummyNextFun = sandbox.stub();
    dummyRequest = createRequest({ id: 4 });

    sandbox.restore();
  });

  it("pass params to endpoint", async function () {
    const statusStub = sandbox.stub();
    const mockRes = createResponse(statusStub);

    const handler = createHandler(
      (req: express.Request) => ({ id: req.params.id }),
      (params: any) => parseParams(params, idRequiredSchema),
      async (id: number) => dummyEndpoint(id)
    );

    await handler(dummyRequest, mockRes, dummyNextFun);

    assert.equal(4, dummyEndpoint.firstCall.lastArg.id);
    assert.isTrue(statusStub.calledWith(200));
  });

  it("returns 400 if failed to parse params", async function () {
    const statusStub = sandbox.stub();
    const mockRes = createResponse(statusStub);

    const handler = createHandler(
      (req: express.Request) => ({ id: "not 4" }),
      (params: any) => parseParams(params, idRequiredSchema),
      async (id: number) => dummyEndpoint(id)
    );

    await handler(dummyRequest, mockRes, dummyNextFun);

    assert.equal(400, statusStub.firstCall.lastArg);
  });

  it("endpoint is not called when failed to parse params", async function () {
    const statusStub = sandbox.stub();
    const mockRes = createResponse(statusStub);

    const handler = createHandler(
      (req: express.Request) => ({}),
      (params: any) => parseParams(params, idRequiredSchema),
      async (id: number) => dummyEndpoint(id)
    );

    await handler(dummyRequest, mockRes, dummyNextFun);

    assert.isTrue(dummyEndpoint.notCalled);
  });

  it("calls express next() if endpoint throws", async function () {
    const statusStub = sandbox.stub();
    const mockRes = createResponse(statusStub);
    const throwingEndpoint = sandbox.stub().throws("something went wrong");

    const handler = createHandler(
      (req: express.Request) => ({ id: req.params.id }),
      (params: any) => parseParams(params, idRequiredSchema),
      async (id: number) => throwingEndpoint(id)
    );

    await handler(dummyRequest, mockRes, dummyNextFun);

    assert.isTrue(dummyNextFun.calledOnce);
  });
});

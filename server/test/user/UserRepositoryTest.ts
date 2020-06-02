import { assert } from "chai";

import * as sinon from "sinon";
import { UserRepository } from "../../src/user/UserRepository";
import { PgUserStore } from "../../src/user/PgUserStore";

describe("UserRepository", function () {
  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.restore();
  });

  it("returns null when no user found", async function () {
    const userStoreStub = sandbox.createStubInstance(PgUserStore);
    userStoreStub.get.resolves(null);

    const sut = new UserRepository(userStoreStub);
    const result = await sut.get(4);
    assert.equal(result, null);
  });
});

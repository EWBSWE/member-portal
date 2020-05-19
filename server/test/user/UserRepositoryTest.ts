import { assert } from "chai"

import * as sinon from "sinon"
import { UserRepository } from "../../user/UserRepository"
import { UserStore } from "../../user/UserStore"
import { UserEntity } from "../../user/UserEntity"

describe("UserRepository", function() {
    const sandbox = sinon.createSandbox()

    afterEach(function() {
        sandbox.restore()
    })

    it("returns null when no user found", async function() {
        const userStoreStub = sandbox.createStubInstance(DummyUserStore)
        userStoreStub.get.resolves(null)

        const sut = new UserRepository(userStoreStub)
        const result = await sut.get(4)
        assert.equal(result, null)
    })
})

class DummyUserStore implements UserStore {
    create(entity: UserEntity): Promise<UserEntity> {
        throw new Error("Method not implemented.")
    }
    get(id: number): Promise<UserEntity | null> {
        throw new Error("Method not implemented.")
    }
    all(): Promise<UserEntity[]> {
        throw new Error("Method not implemented.")
    }
    remove(id: number): Promise<void> {
        throw new Error("Method not implemented.")
    }
}

import { assert } from "chai"
import { UserRepository } from "../../user/UserRepository"
import { UserStore } from "../../user/UserStore"
import { UserEntity } from "../../user/UserEntity"

describe("UserRepository", function() {
    it("returns null when no user found", async function() {
        const sut = new UserRepository(new UserStoreStub())
        const result = await sut.get(4)
        assert.equal(result, null)
    })
})

class UserStoreStub implements UserStore {
    create(entity: UserEntity): Promise<UserEntity> {
        throw new Error("Method not implemented.")
    }

    async get(id: number): Promise<UserEntity | null> {
        return null
    }

    all(): Promise<UserEntity[]> {
        throw new Error("Method not implemented.")
    }

    remove(id: number): Promise<void> {
        throw new Error("Method not implemented.")
    }
}

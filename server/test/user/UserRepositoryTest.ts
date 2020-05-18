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
        throw Error()
    }

    async get(id: number): Promise<UserEntity | null> {
        return null
    }
}

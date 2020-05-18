import * as chai from "chai"
import * as chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const assert = chai.assert

import * as sinon from "sinon"
import * as UserRepositoryProvider from "../../user/UserRepositoryProvider"
import { removeUser } from "../../user/UserController"
import { UserRepository } from "../../user/UserRepository"
import { UserStore } from "../../user/UserStore"
import { UserEntity } from "../../user/UserEntity"
import { User } from "../../user/User"

describe("UserController", function() {
    const sandbox = sinon.createSandbox()

    afterEach(function() {
        sandbox.restore()
    })

    it("resolves if user can remove other user", async function () {
        sandbox.stub(UserRepositoryProvider, 'provide')
            .returns(new UserRepository(new UserStoreStub()))

        const admin = createAdmin()
        const user = createUser()

        await removeUser(admin.id, user.id)
    })

    it("throws if user can't remove other user", async function () {
        sandbox.stub(UserRepositoryProvider, 'provide')
            .returns(new UserRepository(new UserStoreStub()))

        const user = createUser()
        const admin = createAdmin()

        assert.isRejected(removeUser(user.id, admin.id))
    })
})

function createUser(): User {
    return new User(2, "Dummy username", "user")
}

function createAdmin(): User {
    return new User(1, "Dummy username", "admin")
}

class UserStoreStub implements UserStore {
    create(entity: UserEntity): Promise<UserEntity> {
        throw new Error("Method not implemented.")
    }

    async get(id: number): Promise<UserEntity | null> {
        if (id == 1) {
            return new UserEntity(1, "Dummy", "Dummy", "Dummy", "admin")
        } else if (id == 2) {
            return new UserEntity(2, "Dummy", "Dummy", "Dummy", "user")
        } else {
            throw new Error("Method not implemented.")
        }
    }

    all(): Promise<UserEntity[]> {
        throw new Error("Method not implemented.")
    }

    async remove(id: number): Promise<void> {
    }
}

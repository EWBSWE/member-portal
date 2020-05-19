import * as chai from "chai"
import * as chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const assert = chai.assert

import * as sinon from "sinon"
import { UserController } from "../../user/UserController"
import { UserRepository } from "../../user/UserRepository"
import { User } from "../../user/User"

describe("UserController", function() {
    const sandbox = sinon.createSandbox()

    afterEach(function() {
        sandbox.restore()
    })

    const user = new User(1, "dummy username", "user")
    const admin = new User(2, "dummy username", "admin")
    const userRepositoryStub = createStubRepo(sandbox, [user, admin])

    it("resolves if user can remove other user", async function() {
        const sut = createSut(userRepositoryStub)
        await sut.removeUser(admin.id, user.id)
    })

    it("throws if user can't remove other user", async function () {
        const sut = createSut(userRepositoryStub)
        await assert.isRejected(sut.removeUser(user.id, admin.id))
    })
})

function createStubRepo(sandbox: sinon.SinonSandbox, users: User[]): sinon.SinonStubbedInstance<UserRepository> {
    const userRepositoryStub = sandbox.createStubInstance(UserRepository)
    users.forEach(user => {
        userRepositoryStub.get.withArgs(user.id)
            .resolves(user)
    })
    return userRepositoryStub
}

function createSut(userRepo: sinon.SinonStubbedInstance<UserRepository>): UserController {
    //@ts-ignore
    return new UserController(userRepo)
}

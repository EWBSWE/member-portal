import * as chai from "chai"
import * as chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const assert = chai.assert

import * as sinon from "sinon"
import { UserController } from "../../user/UserController"
import { UserRepository } from "../../user/UserRepository"
import { User } from "../../user/User"
import { Role } from "../../user/Role"
import { UserFactory } from "../../user/UserFactory"
import { OutgoingMessageRepository } from "../../outgoing-message/OutgoingMessageRepository"
import { OutgoingMessageFactory } from "../../outgoing-message/OutgoingMessageFactory"

describe("UserController", function() {
    const sandbox = sinon.createSandbox()

    afterEach(function() {
        sandbox.restore()
    })

    const user = new User(1, "dummy username", Role.USER)
    const admin = new User(2, "dummy username", Role.ADMIN)

    const dummyUserFactory = new UserFactory()
    const dummyMessageFactory = new OutgoingMessageFactory("noreply@localhost", "localhost")

    it("resolves if user can remove other user", async function() {
        const userRepositoryStub = stubUserRepository(sandbox, [user, admin])
        const messageRepositoryStub = stubMessageRepository(sandbox)
        const sut = new UserController(dummyUserFactory, userRepositoryStub, messageRepositoryStub, dummyMessageFactory)
        await sut.removeUser(admin.id, user.id)
    })

    it("throws if user can't remove other user", async function () {
        const userRepositoryStub = stubUserRepository(sandbox, [user, admin])
        const messageRepositoryStub = stubMessageRepository(sandbox)
        const sut = new UserController(dummyUserFactory, userRepositoryStub, messageRepositoryStub, dummyMessageFactory)
        await assert.isRejected(sut.removeUser(user.id, admin.id))
    })

    it("enqueues message if user created", async function() {
        const userRepositoryStub = stubUserRepository(sandbox, [user, admin])
        const messageRepositoryMock = stubMessageRepository(sandbox)
        const sut = new UserController(dummyUserFactory, userRepositoryStub, messageRepositoryMock, dummyMessageFactory)
        await sut.createUser(user.username)
        assert.ok(messageRepositoryMock.enqueue.calledOnce)
    })
})

function stubUserRepository(sandbox: sinon.SinonSandbox, users: User[]): any {
    const stub = sandbox.createStubInstance(UserRepository)
    stub.add.resolves()
    users.forEach(user => {
        stub.get.withArgs(user.id)
            .resolves(user)
    })
    return stub
}

function stubMessageRepository(sandbox: sinon.SinonSandbox): any {
    const stub = sandbox.createStubInstance(OutgoingMessageRepository)
    stub.enqueue.resolves()
    return stub
}

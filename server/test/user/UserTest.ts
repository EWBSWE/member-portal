import { assert } from "chai"
import { User } from "../../user/User"
import { Role } from "../../user/Role"

function createUser(): User {
    return new User(1, "Dummy username", Role.USER)
}

function createAdmin(): User {
    return new User(1, "Dummy username", Role.ADMIN)
}

describe("User", function() {
    it("user can remove other users", function() {
        const user = createUser()
        const other = createUser()
        assert.ok(user.canRemove(other))
    })

    it("user cant remove admins", function() {
        const user = createUser()
        const admin = createAdmin()
        assert.notOk(user.canRemove(admin))
    })

    it("admin can remove users", function() {
        const admin = createAdmin()
        const user = createUser()
        assert.ok(admin.canRemove(user))
    })

    it("admin can remove admins", function() {
        const admin = createAdmin()
        const other = createAdmin()
        assert.ok(admin.canRemove(other))
    })
})

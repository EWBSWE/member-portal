import { assert } from "chai"
import { createPassword, authenticate } from "../../user/PasswordService"

describe("PasswordService", function() {
    describe("createPassword", function() {
        it("creates hashed password with salt", function() {
            const input = "hunter2"
            const password = createPassword(input);
            assert.notEqual(password.hashed, input);
        });

        it("creates different password from same input", function() {
            const input = "hunter2"
            const firstPassword = createPassword(input);
            const secondPassword = createPassword(input);
            assert.notEqual(firstPassword.hashed, secondPassword.hashed);
        });
    });

    describe("authenticate", function() {
        it("compares plain text with hash + salt", function() {
            const input = "hunter2";
            const hashedPassword = createPassword(input)
            assert.ok(authenticate(input, hashedPassword.salt, hashedPassword.hashed));
        });
    });
});

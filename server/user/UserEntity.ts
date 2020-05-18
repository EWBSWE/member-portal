import { UnsavedUser } from './User'
import { createPassword } from './PasswordService'

export class UserEntity {
    readonly username: string
    readonly hashedPassword: string
    readonly salt: string
    readonly role: string

    constructor(username: string, hashedPassword: string, salt: string, role: string) {
        this.username = username;
        this.hashedPassword = hashedPassword;
        this.salt = salt;
        this.role = role;
    }

    static foo(user: UnsavedUser): UserEntity {
        const password = createPassword(user.password);
        return new UserEntity(user.username, password.hashed, password.salt, user.role);
    }
}

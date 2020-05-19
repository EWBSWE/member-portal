import { UnsavedUser } from './User'
import { serialize } from "./Role"
import { createPassword } from './PasswordService'

export class UserEntity {
    readonly id: number | null
    readonly username: string
    readonly hashedPassword: string
    readonly salt: string
    readonly role: string

    resetToken?: string

    constructor(id: number | null, username: string, hashedPassword: string, salt: string, role: string) {
        this.id = id 
        this.username = username
        this.hashedPassword = hashedPassword
        this.salt = salt
        this.role = role
    }

    static createFrom(user: UnsavedUser): UserEntity {
        const password = createPassword(user.password)
        return new UserEntity(null, user.username, password.hashed, password.salt, serialize(user.role));
    }
}
